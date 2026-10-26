package com.gearbids.auction.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;

@Repository
public class InspectionRepository {

    private final JdbcTemplate jdbcTemplate;

    public InspectionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<Map<String, Object>> findLatestByVehicleId(int vehicleId) {
        String sql = "SELECT * FROM inspections WHERE vehicle_id = ? ORDER BY created_at DESC LIMIT 1";
        try {
            return Optional.ofNullable(jdbcTemplate.queryForMap(sql, vehicleId));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }
}
