package com.gearbids.auction.repository;

import com.gearbids.auction.model.Bid;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public class BidRepository {

    private final JdbcTemplate jdbcTemplate;

    public BidRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Bid> rowMapper = (rs, rowNum) -> {
        Bid b = new Bid();
        b.setId(rs.getInt("id"));
        b.setAuctionId(rs.getInt("auction_id"));
        b.setBidderId(rs.getInt("bidder_id"));
        b.setAmount(rs.getBigDecimal("amount"));
        if (rs.getTimestamp("created_at") != null) {
            b.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
        }
        try {
            b.setBidderUsername(rs.getString("bidder_username"));
        } catch (SQLException ignored) {}
        return b;
    };

    public List<Bid> findByAuctionId(int auctionId) {
        String sql = "SELECT b.*, u.username AS bidder_username " +
                "FROM bids b JOIN users u ON b.bidder_id = u.id " +
                "WHERE b.auction_id = ? " +
                "ORDER BY b.amount DESC, b.created_at DESC";
        return jdbcTemplate.query(sql, rowMapper, auctionId);
    }

    public Bid create(int auctionId, int bidderId, BigDecimal amount) {
        String sql = "INSERT INTO bids (auction_id, bidder_id, amount) VALUES (?, ?, ?)";
        org.springframework.jdbc.support.KeyHolder keyHolder = new org.springframework.jdbc.support.GeneratedKeyHolder();
        jdbcTemplate.update(conn -> {
            java.sql.PreparedStatement ps = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, auctionId);
            ps.setInt(2, bidderId);
            ps.setBigDecimal(3, amount);
            return ps;
        }, keyHolder);

        int newId = RepositoryUtils.getGeneratedId(keyHolder);
        Bid bid = new Bid();
        bid.setId(newId);
        bid.setAuctionId(auctionId);
        bid.setBidderId(bidderId);
        bid.setAmount(amount);
        bid.setCreatedAt(OffsetDateTime.now());
        return bid;
    }
}
