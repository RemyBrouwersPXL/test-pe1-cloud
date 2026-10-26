package com.gearbids.auction.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class NotificationRepository {

    private final JdbcTemplate jdbcTemplate;

    public NotificationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void createOutbidNotification(int recipientUserId, int auctionId, String title, String message, String metadataJson) {
        String sql = "INSERT INTO notifications (user_id, auction_id, type, title, message, metadata) " +
                "VALUES (?, ?, 'OUTBID'::notification_type, ?, ?, ?::jsonb)";
        try {
            jdbcTemplate.update(sql, recipientUserId, auctionId, title, message, metadataJson);
        } catch (Exception e) {
            // Non-critical background failure logged
            System.err.println("Could not persist local DB notification: " + e.getMessage());
        }
    }
}
