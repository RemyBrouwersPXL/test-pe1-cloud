package com.gearbids.auction.repository;

import com.gearbids.auction.model.Comment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public class CommentRepository {

    private final JdbcTemplate jdbcTemplate;

    public CommentRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Comment> rowMapper = (rs, rowNum) -> {
        Comment c = new Comment();
        c.setId(rs.getInt("id"));
        c.setAuctionId(rs.getInt("auction_id"));
        c.setUserId(rs.getInt("user_id"));
        int parentId = rs.getInt("parent_comment_id");
        if (!rs.wasNull()) {
            c.setParentCommentId(parentId);
        }
        c.setContent(rs.getString("content"));
        c.setSellerComment(rs.getBoolean("is_seller_comment"));
        if (rs.getTimestamp("created_at") != null) {
            c.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
        }
        try {
            c.setAuthorName(rs.getString("author_name"));
        } catch (SQLException ignored) {}
        try {
            c.setAuthorUsername(rs.getString("author_username"));
        } catch (SQLException ignored) {}
        try {
            c.setAuthorAvatar(rs.getString("author_avatar"));
        } catch (SQLException ignored) {}
        return c;
    };

    public List<Comment> findByAuctionId(int auctionId) {
        String sql = "SELECT c.*, u.full_name AS author_name, u.username AS author_username, u.avatar_url AS author_avatar " +
                "FROM comments c JOIN users u ON c.user_id = u.id " +
                "WHERE c.auction_id = ? " +
                "ORDER BY c.created_at ASC";
        return jdbcTemplate.query(sql, rowMapper, auctionId);
    }

    public Comment create(int auctionId, int userId, Integer parentCommentId, String content, boolean isSellerComment) {
        String sql = "INSERT INTO comments (auction_id, user_id, parent_comment_id, content, is_seller_comment) " +
                "VALUES (?, ?, ?, ?, ?)";
        org.springframework.jdbc.support.KeyHolder keyHolder = new org.springframework.jdbc.support.GeneratedKeyHolder();
        jdbcTemplate.update(conn -> {
            java.sql.PreparedStatement ps = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, auctionId);
            ps.setInt(2, userId);
            if (parentCommentId != null) {
                ps.setInt(3, parentCommentId);
            } else {
                ps.setNull(3, java.sql.Types.INTEGER);
            }
            ps.setString(4, content);
            ps.setBoolean(5, isSellerComment);
            return ps;
        }, keyHolder);

        int newId = RepositoryUtils.getGeneratedId(keyHolder);
        Comment comment = new Comment();
        comment.setId(newId);
        comment.setAuctionId(auctionId);
        comment.setUserId(userId);
        comment.setParentCommentId(parentCommentId);
        comment.setContent(content);
        comment.setSellerComment(isSellerComment);
        comment.setCreatedAt(OffsetDateTime.now());
        return comment;
    }
}
