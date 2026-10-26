package com.gearbids.auction.repository;

import com.gearbids.auction.dto.AuctionDto;
import com.gearbids.auction.model.Auction;
import com.gearbids.auction.model.AuctionStatus;
import com.gearbids.auction.model.Vehicle;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.*;

@Repository
public class AuctionRepository {

    private final JdbcTemplate jdbcTemplate;

    public AuctionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static List<String> toList(Array array) throws SQLException {
        if (array == null) return Collections.emptyList();
        Object arrObj = array.getArray();
        if (arrObj instanceof String[]) {
            return Arrays.asList((String[]) arrObj);
        } else if (arrObj instanceof Object[]) {
            Object[] raw = (Object[]) arrObj;
            String[] res = new String[raw.length];
            for (int i = 0; i < raw.length; i++) {
                res[i] = raw[i] != null ? raw[i].toString() : null;
            }
            return Arrays.asList(res);
        }
        return Collections.emptyList();
    }

    public final RowMapper<Auction> auctionRowMapper = (rs, rowNum) -> {
        Auction a = new Auction();
        a.setId(rs.getInt("id"));
        a.setVehicleId(rs.getInt("vehicle_id"));
        a.setSellerId(rs.getInt("seller_id"));
        a.setTitle(rs.getString("title"));
        a.setSlug(rs.getString("slug"));
        a.setDescription(rs.getString("description"));
        a.setDougsTake(rs.getString("dougs_take"));
        a.setStartingBid(rs.getBigDecimal("starting_bid"));
        a.setCurrentBid(rs.getBigDecimal("current_bid"));
        a.setReservePrice(rs.getBigDecimal("reserve_price"));
        a.setNoReserve(rs.getBoolean("is_no_reserve"));
        a.setReserveMet(rs.getBoolean("reserve_met"));
        a.setMinIncrement(rs.getBigDecimal("min_increment"));
        if (rs.getTimestamp("start_time") != null) {
            a.setStartTime(rs.getObject("start_time", OffsetDateTime.class));
        }
        if (rs.getTimestamp("end_time") != null) {
            a.setEndTime(rs.getObject("end_time", OffsetDateTime.class));
        }
        String statusStr = rs.getString("status");
        if (statusStr != null) {
            a.setStatus(AuctionStatus.valueOf(statusStr));
        }
        int highBidder = rs.getInt("high_bidder_id");
        if (!rs.wasNull()) {
            a.setHighBidderId(highBidder);
        }
        a.setTotalBids(rs.getInt("total_bids"));
        a.setViewsCount(rs.getInt("views_count"));
        a.setThumbnailUrl(rs.getString("thumbnail_url"));
        a.setGalleryImages(toList(rs.getArray("gallery_images")));
        a.setLocation(rs.getString("location"));
        if (rs.getTimestamp("created_at") != null) {
            a.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
        }
        if (rs.getTimestamp("updated_at") != null) {
            a.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
        }

        // Try mapping joined vehicle columns if present in SELECT
        try {
            if (rs.findColumn("vin") > 0) {
                Vehicle v = new Vehicle();
                v.setId(a.getVehicleId());
                v.setVin(rs.getString("vin"));
                v.setYear(rs.getInt("year"));
                v.setMake(rs.getString("make"));
                v.setModel(rs.getString("model"));
                v.setTrim(rs.getString("trim"));
                v.setMileage(rs.getInt("mileage"));
                v.setTransmission(rs.getString("transmission"));
                v.setDrivetrain(rs.getString("drivetrain"));
                v.setEngine(rs.getString("engine"));
                v.setExteriorColor(rs.getString("exterior_color"));
                v.setInteriorColor(rs.getString("interior_color"));
                v.setBodyStyle(rs.getString("body_style"));
                a.setVehicle(v);
            }
        } catch (SQLException ignored) {}

        // Try mapping joined usernames
        try {
            a.setSellerUsername(rs.getString("seller_username"));
        } catch (SQLException ignored) {}
        try {
            a.setHighBidderUsername(rs.getString("high_bidder_username"));
        } catch (SQLException ignored) {}

        return a;
    };

    public Optional<Auction> findByIdForUpdate(int id) {
        String sql = "SELECT * FROM auctions WHERE id = ? FOR UPDATE";
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, auctionRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<Auction> findByIdOrSlug(String idOrSlug) {
        boolean isNumeric = idOrSlug.matches("\\d+");
        String sql = "SELECT a.*, v.vin, v.year, v.make, v.model, v.trim, v.mileage, v.transmission, " +
                "v.drivetrain, v.engine, v.exterior_color, v.interior_color, v.body_style, " +
                "u.username AS seller_username, hb.username AS high_bidder_username " +
                "FROM auctions a " +
                "JOIN vehicles v ON a.vehicle_id = v.id " +
                "JOIN users u ON a.seller_id = u.id " +
                "LEFT JOIN users hb ON a.high_bidder_id = hb.id " +
                "WHERE " + (isNumeric ? "a.id = ?" : "a.slug = ?");

        try {
            Object param = isNumeric ? Integer.parseInt(idOrSlug) : idOrSlug;
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, auctionRowMapper, param));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void incrementViews(int auctionId) {
        jdbcTemplate.update("UPDATE auctions SET views_count = views_count + 1 WHERE id = ?", auctionId);
    }

    public List<Auction> listWithFilters(String status, String make, String bodyStyle, String transmission,
                                         String search, String sort, int limit, int offset) {
        StringBuilder sql = new StringBuilder(
                "SELECT a.*, v.vin, v.year, v.make, v.model, v.trim, v.mileage, v.transmission, " +
                "v.drivetrain, v.engine, v.exterior_color, v.interior_color, v.body_style, " +
                "u.username AS seller_username, hb.username AS high_bidder_username " +
                "FROM auctions a " +
                "JOIN vehicles v ON a.vehicle_id = v.id " +
                "JOIN users u ON a.seller_id = u.id " +
                "LEFT JOIN users hb ON a.high_bidder_id = hb.id " +
                "WHERE 1=1 "
        );

        List<Object> params = new ArrayList<>();
        if (status != null && !status.isBlank()) {
            sql.append("AND a.status = ?::auction_status ");
            params.add(status.toUpperCase().trim());
        }
        if (make != null && !make.isBlank()) {
            sql.append("AND LOWER(v.make) = LOWER(?) ");
            params.add(make.trim());
        }
        if (bodyStyle != null && !bodyStyle.isBlank()) {
            sql.append("AND LOWER(v.body_style) = LOWER(?) ");
            params.add(bodyStyle.trim());
        }
        if (transmission != null && !transmission.isBlank()) {
            sql.append("AND LOWER(v.transmission) LIKE LOWER(?) ");
            params.add("%" + transmission.trim() + "%");
        }
        if (search != null && !search.isBlank()) {
            String q = "%" + search.toLowerCase().trim() + "%";
            sql.append("AND (LOWER(a.title) LIKE ? OR LOWER(v.make) LIKE ? OR LOWER(v.model) LIKE ? OR LOWER(v.vin) LIKE ?) ");
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
        }

        if ("ending_soon".equalsIgnoreCase(sort)) {
            sql.append("ORDER BY (a.status = 'ACTIVE') DESC, a.end_time ASC ");
        } else if ("newly_listed".equalsIgnoreCase(sort)) {
            sql.append("ORDER BY a.start_time DESC ");
        } else if ("lowest_mileage".equalsIgnoreCase(sort)) {
            sql.append("ORDER BY v.mileage ASC ");
        } else if ("bid_asc".equalsIgnoreCase(sort)) {
            sql.append("ORDER BY a.current_bid ASC ");
        } else if ("bid_desc".equalsIgnoreCase(sort)) {
            sql.append("ORDER BY a.current_bid DESC ");
        } else {
            sql.append("ORDER BY (a.status = 'ACTIVE') DESC, a.end_time ASC ");
        }

        sql.append("LIMIT ? OFFSET ?");
        params.add(limit);
        params.add(offset);

        return jdbcTemplate.query(sql.toString(), auctionRowMapper, params.toArray());
    }

    public long countWithFilters(String status, String make, String bodyStyle, String transmission, String search) {
        StringBuilder sql = new StringBuilder(
                "SELECT COUNT(*) FROM auctions a JOIN vehicles v ON a.vehicle_id = v.id WHERE 1=1 "
        );
        List<Object> params = new ArrayList<>();
        if (status != null && !status.isBlank()) {
            sql.append("AND a.status = ?::auction_status ");
            params.add(status.toUpperCase().trim());
        }
        if (make != null && !make.isBlank()) {
            sql.append("AND LOWER(v.make) = LOWER(?) ");
            params.add(make.trim());
        }
        if (bodyStyle != null && !bodyStyle.isBlank()) {
            sql.append("AND LOWER(v.body_style) = LOWER(?) ");
            params.add(bodyStyle.trim());
        }
        if (transmission != null && !transmission.isBlank()) {
            sql.append("AND LOWER(v.transmission) LIKE LOWER(?) ");
            params.add("%" + transmission.trim() + "%");
        }
        if (search != null && !search.isBlank()) {
            String q = "%" + search.toLowerCase().trim() + "%";
            sql.append("AND (LOWER(a.title) LIKE ? OR LOWER(v.make) LIKE ? OR LOWER(v.model) LIKE ? OR LOWER(v.vin) LIKE ?) ");
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
        }

        Long count = jdbcTemplate.queryForObject(sql.toString(), Long.class, params.toArray());
        return count != null ? count : 0L;
    }

    public Auction create(Auction auction) {
        String sql = "INSERT INTO auctions (vehicle_id, seller_id, title, slug, description, dougs_take, " +
                "starting_bid, current_bid, reserve_price, is_no_reserve, reserve_met, min_increment, " +
                "start_time, end_time, status, thumbnail_url, gallery_images, location) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE'::auction_status, ?, ?, ?)";

        org.springframework.jdbc.support.KeyHolder keyHolder = new org.springframework.jdbc.support.GeneratedKeyHolder();
        jdbcTemplate.update((java.sql.Connection conn) -> {
            java.sql.PreparedStatement ps = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, auction.getVehicleId());
            ps.setInt(2, auction.getSellerId());
            ps.setString(3, auction.getTitle());
            ps.setString(4, auction.getSlug());
            ps.setString(5, auction.getDescription());
            ps.setString(6, auction.getDougsTake());
            ps.setBigDecimal(7, auction.getStartingBid());
            ps.setBigDecimal(8, auction.getCurrentBid());
            ps.setBigDecimal(9, auction.getReservePrice());
            ps.setBoolean(10, auction.isNoReserve());
            ps.setBoolean(11, auction.isReserveMet());
            ps.setBigDecimal(12, auction.getMinIncrement() != null ? auction.getMinIncrement() : BigDecimal.valueOf(100.00));
            ps.setObject(13, auction.getStartTime());
            ps.setObject(14, auction.getEndTime());
            ps.setString(15, auction.getThumbnailUrl());

            String[] galleryArr = auction.getGalleryImages() != null ? auction.getGalleryImages().toArray(new String[0]) : new String[0];
            ps.setArray(16, conn.createArrayOf("text", galleryArr));
            ps.setString(17, auction.getLocation() != null ? auction.getLocation() : "Unknown");

            return ps;
        }, keyHolder);

        int newId = RepositoryUtils.getGeneratedId(keyHolder);
        return findByIdOrSlug(String.valueOf(newId)).orElseThrow(() -> new IllegalStateException("Auction not found after creation"));
    }

    public Auction updateBidAndAntiSniping(int auctionId, BigDecimal bidAmount, int bidderId,
                                           boolean reserveMet, OffsetDateTime newEndTime) {
        String sql = "UPDATE auctions SET current_bid = ?, high_bidder_id = ?, total_bids = total_bids + 1, " +
                "reserve_met = ?, end_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";

        jdbcTemplate.update(sql, bidAmount, bidderId, reserveMet, newEndTime, auctionId);
        return findByIdOrSlug(String.valueOf(auctionId)).orElseThrow(() -> new IllegalStateException("Auction not found after bid update"));
    }

    public AuctionDto.AuctionStatsResponse getStats() {
        String sql = "SELECT " +
                "COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_auctions, " +
                "COALESCE(SUM(total_bids), 0) AS total_bids, " +
                "COALESCE(SUM(current_bid) FILTER (WHERE status = 'SOLD'), 0) AS total_volume, " +
                "COUNT(*) FILTER (WHERE status = 'SOLD') AS cars_sold " +
                "FROM auctions";

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new AuctionDto.AuctionStatsResponse(
                rs.getLong("active_auctions"),
                rs.getLong("total_bids"),
                rs.getBigDecimal("total_volume"),
                rs.getLong("cars_sold")
        ));
    }
}
