package com.gearbids.auction.repository;

import com.gearbids.auction.model.User;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<User> rowMapper = (rs, rowNum) -> {
        User user = new User();
        user.setId(rs.getInt("id"));
        user.setUsername(rs.getString("username"));
        user.setEmail(rs.getString("email"));
        user.setPasswordHash(rs.getString("password_hash"));
        user.setFullName(rs.getString("full_name"));
        user.setAvatarUrl(rs.getString("avatar_url"));
        user.setBio(rs.getString("bio"));
        user.setLocation(rs.getString("location"));
        user.setSeller(rs.getBoolean("is_seller"));
        user.setAdmin(rs.getBoolean("is_admin"));
        if (rs.getTimestamp("created_at") != null) {
            user.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
        }
        if (rs.getTimestamp("updated_at") != null) {
            user.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
        }
        return user;
    };

    public Optional<User> findById(int id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, rowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<User> findByUsernameOrEmail(String identifier) {
        String sql = "SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)";
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, rowMapper, identifier, identifier));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public boolean existsByUsernameOrEmail(String username, String email) {
        String sql = "SELECT COUNT(*) FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, username, email);
        return count != null && count > 0;
    }

    public User create(String username, String email, String passwordHash, String fullName, String avatarUrl, String location) {
        String sql = "INSERT INTO users (username, email, password_hash, full_name, avatar_url, location, is_seller, is_admin) " +
                     "VALUES (?, ?, ?, ?, ?, ?, TRUE, FALSE)";
        org.springframework.jdbc.support.KeyHolder keyHolder = new org.springframework.jdbc.support.GeneratedKeyHolder();
        jdbcTemplate.update(conn -> {
            java.sql.PreparedStatement ps = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, username.toLowerCase().trim());
            ps.setString(2, email.toLowerCase().trim());
            ps.setString(3, passwordHash);
            ps.setString(4, fullName.trim());
            ps.setString(5, avatarUrl);
            ps.setString(6, location != null ? location : "Unknown");
            return ps;
        }, keyHolder);

        int newId = RepositoryUtils.getGeneratedId(keyHolder);
        return findById(newId).orElseThrow(() -> new IllegalStateException("User not found after creation"));
    }

    public void updatePasswordHash(int id, String passwordHash) {
        String sql = "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        jdbcTemplate.update(sql, passwordHash, id);
    }
}
