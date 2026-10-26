import { Router, Request, Response } from 'express';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import { query, pool } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { config } from '../config/env';

const router = Router();

// Rate limiting for bidding endpoint (SEC-08)
const bidLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // max 60 bids per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Too many bidding attempts. Please wait a moment before trying again.' },
});

// Helper to slugify vehicle title
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// -----------------------------------------------------------------------------
// GET /api/auctions - List auctions with rich filtering & sorting
// -----------------------------------------------------------------------------
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, make, body_style, transmission, search, sort, limit = 20, offset = 0 } = req.query;

    let sql = `
      SELECT 
        a.id, a.vehicle_id, a.seller_id, a.title, a.slug, a.starting_bid,
        a.current_bid, a.is_no_reserve, a.reserve_met, a.min_increment,
        a.start_time, a.end_time, a.status, a.high_bidder_id, a.total_bids,
        a.views_count, a.thumbnail_url, a.location, a.created_at,
        v.year, v.make, v.model, v.trim, v.mileage, v.transmission,
        v.drivetrain, v.engine, v.exterior_color, v.interior_color, v.body_style,
        u.username AS seller_username,
        hb.username AS high_bidder_username
      FROM auctions a
      JOIN vehicles v ON a.vehicle_id = v.id
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN users hb ON a.high_bidder_id = hb.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let pIdx = 1;

    if (status) {
      sql += ` AND a.status = $${pIdx++}`;
      params.push(status);
    }

    if (make) {
      sql += ` AND LOWER(v.make) = LOWER($${pIdx++})`;
      params.push(make);
    }

    if (body_style) {
      sql += ` AND LOWER(v.body_style) = LOWER($${pIdx++})`;
      params.push(body_style);
    }

    if (transmission) {
      sql += ` AND LOWER(v.transmission) LIKE LOWER($${pIdx++})`;
      params.push(`%${transmission}%`);
    }

    if (search) {
      sql += ` AND (
        LOWER(a.title) LIKE LOWER($${pIdx}) OR 
        LOWER(v.make) LIKE LOWER($${pIdx}) OR 
        LOWER(v.model) LIKE LOWER($${pIdx}) OR
        LOWER(v.vin) LIKE LOWER($${pIdx})
      )`;
      params.push(`%${search}%`);
      pIdx++;
    }

    // Sorting
    switch (sort) {
      case 'ending_soon':
        sql += ` ORDER BY (a.status = 'ACTIVE') DESC, a.end_time ASC`;
        break;
      case 'newly_listed':
        sql += ` ORDER BY a.created_at DESC`;
        break;
      case 'lowest_mileage':
        sql += ` ORDER BY v.mileage ASC`;
        break;
      case 'bid_high':
        sql += ` ORDER BY a.current_bid DESC`;
        break;
      default:
        // Default: Active auctions ending soonest first, then ended
        sql += ` ORDER BY (a.status = 'ACTIVE') DESC, a.end_time ASC`;
    }

    sql += ` LIMIT $${pIdx++} OFFSET $${pIdx++}`;
    params.push(Number(limit), Number(offset));

    const result = await query(sql, params);

    return res.status(200).json({
      auctions: result.rows,
      count: result.rows.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Error fetching auctions:', error);
    return res.status(500).json({ error: 'Failed to retrieve auctions' });
  }
});

// -----------------------------------------------------------------------------
// GET /api/auctions/stats - Platform Overview
// -----------------------------------------------------------------------------
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const statsResult = await query(`
      SELECT 
        COUNT(*) AS total_auctions,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_auctions,
        COUNT(*) FILTER (WHERE status = 'SOLD') AS sold_auctions,
        COALESCE(SUM(current_bid) FILTER (WHERE status = 'SOLD'), 0) AS total_sales_volume,
        COALESCE(SUM(total_bids), 0) AS total_bids_placed
      FROM auctions
    `);

    const usersCount = await query('SELECT COUNT(*) FROM users');

    return res.status(200).json({
      stats: {
        ...statsResult.rows[0],
        total_registered_users: usersCount.rows[0].count,
      },
    });
  } catch (error) {
    console.error('Error retrieving stats:', error);
    return res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

// -----------------------------------------------------------------------------
// GET /api/auctions/:idOrSlug - Single auction full detail
// -----------------------------------------------------------------------------
router.get('/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params;
    const isNumeric = /^\d+$/.test(idOrSlug);

    const auctionQuery = `
      SELECT 
        a.*,
        v.vin, v.year, v.make, v.model, v.trim, v.mileage, v.transmission,
        v.drivetrain, v.engine, v.exterior_color, v.interior_color, v.body_style,
        v.highlights, v.equipment, v.modifications, v.known_flaws,
        u.username AS seller_username, u.full_name AS seller_name, u.avatar_url AS seller_avatar,
        u.bio AS seller_bio,
        hb.username AS high_bidder_username
      FROM auctions a
      JOIN vehicles v ON a.vehicle_id = v.id
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN users hb ON a.high_bidder_id = hb.id
      WHERE ${isNumeric ? 'a.id = $1' : 'a.slug = $1'}
    `;

    const auctionResult = await query(auctionQuery, [isNumeric ? parseInt(idOrSlug, 10) : idOrSlug]);

    if (auctionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    const auction = auctionResult.rows[0];

    // Increment view count asynchronously
    query('UPDATE auctions SET views_count = views_count + 1 WHERE id = $1', [auction.id]).catch(() => {});

    // Fetch bids
    const bidsResult = await query(
      `SELECT b.id, b.amount, b.created_at, u.username AS bidder_username, u.avatar_url AS bidder_avatar
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       WHERE b.auction_id = $1
       ORDER BY b.amount DESC, b.created_at DESC
       LIMIT 50`,
      [auction.id]
    );

    // Fetch comments
    const commentsResult = await query(
      `SELECT c.id, c.content, c.is_seller_comment, c.created_at, c.parent_comment_id,
              u.id AS user_id, u.username, u.full_name, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.auction_id = $1
       ORDER BY c.created_at ASC`,
      [auction.id]
    );

    // Fetch inspection report
    const inspectionResult = await query(
      `SELECT * FROM inspections WHERE vehicle_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [auction.vehicle_id]
    );

    return res.status(200).json({
      auction,
      bids: bidsResult.rows,
      comments: commentsResult.rows,
      inspection: inspectionResult.rows[0] || null,
    });
  } catch (error) {
    console.error('Error fetching auction detail:', error);
    return res.status(500).json({ error: 'Failed to retrieve auction' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/auctions - Create a new vehicle & auction listing
// -----------------------------------------------------------------------------
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const sellerId = req.session.userId!;
    const {
      vin, year, make, model, trim, mileage, transmission, drivetrain,
      engine, exterior_color, interior_color, body_style,
      highlights, equipment, modifications, known_flaws,
      title, description, dougs_take, starting_bid = 1000,
      reserve_price, is_no_reserve = false, duration_days = 7,
      thumbnail_url, gallery_images = [], location
    } = req.body;

    if (!vin || !year || !make || !model || !transmission || !thumbnail_url || !location) {
      return res.status(400).json({ error: 'Missing required vehicle or auction listing fields' });
    }

    await client.query('BEGIN');

    // 1. Insert vehicle
    const vehicleRes = await client.query(
      `INSERT INTO vehicles (
        vin, year, make, model, trim, mileage, transmission, drivetrain,
        engine, exterior_color, interior_color, body_style,
        highlights, equipment, modifications, known_flaws
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id`,
      [
        vin.toUpperCase().trim(), year, make, model, trim, mileage, transmission,
        drivetrain || 'RWD', engine || 'Standard Engine', exterior_color, interior_color,
        body_style, highlights || [], equipment || [], modifications || [], known_flaws || []
      ]
    );

    const vehicleId = vehicleRes.rows[0].id;
    const baseSlug = slugify(`${year}-${make}-${model}-${vehicleId}`);
    const listingTitle = title || `${year} ${make} ${model} ${trim || ''}`.trim();

    // 2. Insert auction
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration_days * 24 * 60 * 60 * 1000);

    const parsedStartingBid = Number(starting_bid);
    const parsedReserve = is_no_reserve ? null : (reserve_price ? Number(reserve_price) : null);

    const auctionRes = await client.query(
      `INSERT INTO auctions (
        vehicle_id, seller_id, title, slug, description, dougs_take,
        starting_bid, current_bid, reserve_price, is_no_reserve, reserve_met,
        min_increment, start_time, end_time, status, thumbnail_url, gallery_images, location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'ACTIVE', $15, $16, $17)
      RETURNING *`,
      [
        vehicleId, sellerId, listingTitle, baseSlug, description || 'No description provided.',
        dougs_take || null, parsedStartingBid, parsedStartingBid, parsedReserve,
        is_no_reserve, is_no_reserve, 100.00, startTime, endTime,
        thumbnail_url, gallery_images, location
      ]
    );

    await client.query('COMMIT');

    // Trigger asynchronous inspection request to inspection microservice (SEC-07: Internal endpoint + service token)
    try {
      axios.post(`${config.services.inspectionsUrl}/internal/inspect`, {
        vehicle_id: vehicleId,
        vin: vin.toUpperCase().trim(),
        year, make, model, mileage
      }, {
        headers: { 'x-service-token': config.internalServiceToken },
        timeout: 5000,
      }).catch(e => console.warn('Could not contact inspection microservice:', e.message));
    } catch (_) {}

    return res.status(201).json({
      message: 'Auction created successfully',
      auction: auctionRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating auction:', error);
    return res.status(500).json({ error: 'Failed to create auction listing' });
  } finally {
    client.release();
  }
});

// -----------------------------------------------------------------------------
// POST /api/auctions/:id/bid - Place Bid with Concurrency Lock & Anti-Sniping
// -----------------------------------------------------------------------------
router.post('/:id/bid', bidLimiter, requireAuth, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const auctionId = parseInt(req.params.id, 10);
    const bidderId = req.session.userId!;
    const { amount } = req.body;

    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Valid bid amount required' });
    }
    const bidAmount = Number(amount);

    await client.query('BEGIN');

    // Lock the auction row for update (prevents race conditions)
    const auctionLock = await client.query(
      `SELECT * FROM auctions WHERE id = $1 FOR UPDATE`,
      [auctionId]
    );

    if (auctionLock.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Auction not found' });
    }

    const auction = auctionLock.rows[0];

    // Check if auction is active
    if (auction.status !== 'ACTIVE') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Cannot bid: auction is currently ${auction.status}` });
    }

    const now = new Date();
    const endTime = new Date(auction.end_time);

    // Check if auction has expired
    if (now >= endTime) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Auction has already ended' });
    }

    // Prevent seller from bidding on their own auction
    if (auction.seller_id === bidderId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Sellers are not permitted to bid on their own listings' });
    }

    // Minimum bid validation
    const currentBid = Number(auction.current_bid);
    const minIncrement = Number(auction.min_increment);
    const minAllowed = auction.total_bids === 0 ? currentBid : currentBid + minIncrement;

    if (bidAmount < minAllowed) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Bid must be at least $${minAllowed.toLocaleString()} (minimum increment: $${minIncrement})`,
      });
    }

    // Check if user is already the high bidder
    if (auction.high_bidder_id === bidderId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You are already the highest bidder' });
    }

    const previousHighBidderId = auction.high_bidder_id;

    // Insert bid
    const bidRes = await client.query(
      `INSERT INTO bids (auction_id, bidder_id, amount) VALUES ($1, $2, $3) RETURNING *`,
      [auctionId, bidderId, bidAmount]
    );

    // Check Reserve Price
    let reserveMet = auction.reserve_met;
    if (!reserveMet && auction.reserve_price && bidAmount >= Number(auction.reserve_price)) {
      reserveMet = true;
    }
    if (auction.is_no_reserve) {
      reserveMet = true;
    }

    // -------------------------------------------------------------------------
    // ANTI-SNIPING LOGIC:
    // If a bid is placed within 2 minutes (120 seconds) of auction closing,
    // extend end_time by 2 minutes! (Cars & Bids signature feature)
    // -------------------------------------------------------------------------
    const remainingSeconds = (endTime.getTime() - now.getTime()) / 1000;
    let antiSnipingTriggered = false;
    let newEndTime = endTime;

    if (remainingSeconds <= 120) {
      antiSnipingTriggered = true;
      newEndTime = new Date(endTime.getTime() + 120 * 1000); // Add 2 minutes
    }

    // Update auction record
    const updatedAuctionRes = await client.query(
      `UPDATE auctions 
       SET current_bid = $1,
           high_bidder_id = $2,
           total_bids = total_bids + 1,
           reserve_met = $3,
           end_time = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [bidAmount, bidderId, reserveMet, newEndTime, auctionId]
    );

    await client.query('COMMIT');

    const updatedAuction = updatedAuctionRes.rows[0];

    // Asynchronously notify previous high bidder they've been outbid
    if (previousHighBidderId && previousHighBidderId !== bidderId) {
      // 1. Insert local DB notification
      query(
        `INSERT INTO notifications (user_id, auction_id, type, title, message, metadata)
         VALUES ($1, $2, 'OUTBID', $3, $4, $5)`,
        [
          previousHighBidderId,
          auctionId,
          `Outbid on ${auction.title}!`,
          `Another bidder placed a higher bid of $${bidAmount.toLocaleString()}.`,
          JSON.stringify({ auction_id: auctionId, new_bid: bidAmount, end_time: newEndTime })
        ]
      ).catch(() => {});

      // 2. Call Notification Microservice (SEC-03: Internal endpoint + service token)
      try {
        axios.post(`${config.services.notificationsUrl}/internal/events`, {
          type: 'OUTBID',
          recipient_user_id: previousHighBidderId,
          auction_id: auctionId,
          auction_title: auction.title,
          new_bid_amount: bidAmount,
          new_end_time: newEndTime,
        }, {
          headers: { 'x-service-token': config.internalServiceToken },
          timeout: 5000,
        }).catch(() => {});
      } catch (_) {}
    }

    return res.status(200).json({
      message: 'Bid placed successfully!',
      bid: bidRes.rows[0],
      auction: updatedAuction,
      anti_sniping_extended: antiSnipingTriggered,
      new_end_time: newEndTime,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error placing bid:', error);
    return res.status(500).json({ error: 'Failed to place bid' });
  } finally {
    client.release();
  }
});

// -----------------------------------------------------------------------------
// POST /api/auctions/:id/comments - Add Comment to Auction
// -----------------------------------------------------------------------------
router.post('/:id/comments', requireAuth, async (req: Request, res: Response) => {
  try {
    const auctionId = parseInt(req.params.id, 10);
    const userId = req.session.userId!;
    const { content, parent_comment_id } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    // Check if user is seller of this auction
    const auctionRes = await query('SELECT seller_id FROM auctions WHERE id = $1', [auctionId]);
    if (auctionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    const isSeller = auctionRes.rows[0].seller_id === userId;

    const result = await query(
      `INSERT INTO comments (auction_id, user_id, parent_comment_id, content, is_seller_comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [auctionId, userId, parent_comment_id || null, content.trim(), isSeller]
    );

    const userRes = await query('SELECT username, full_name, avatar_url FROM users WHERE id = $1', [userId]);

    return res.status(201).json({
      comment: {
        ...result.rows[0],
        ...userRes.rows[0],
      },
    });
  } catch (error) {
    console.error('Error posting comment:', error);
    return res.status(500).json({ error: 'Failed to post comment' });
  }
});

export default router;
