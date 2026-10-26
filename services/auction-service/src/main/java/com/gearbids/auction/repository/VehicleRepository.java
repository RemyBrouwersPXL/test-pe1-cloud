package com.gearbids.auction.repository;

import com.gearbids.auction.model.Vehicle;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Repository
public class VehicleRepository {

    private final JdbcTemplate jdbcTemplate;

    public VehicleRepository(JdbcTemplate jdbcTemplate) {
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

    public final RowMapper<Vehicle> rowMapper = (rs, rowNum) -> {
        Vehicle v = new Vehicle();
        v.setId(rs.getInt("id"));
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
        v.setHighlights(toList(rs.getArray("highlights")));
        v.setEquipment(toList(rs.getArray("equipment")));
        v.setModifications(toList(rs.getArray("modifications")));
        v.setKnownFlaws(toList(rs.getArray("known_flaws")));
        if (rs.getTimestamp("created_at") != null) {
            v.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
        }
        return v;
    };

    public Optional<Vehicle> findById(int id) {
        String sql = "SELECT * FROM vehicles WHERE id = ?";
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, rowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Vehicle create(Vehicle vehicle) {
        String sql = "INSERT INTO vehicles (vin, year, make, model, trim, mileage, transmission, drivetrain, " +
                "engine, exterior_color, interior_color, body_style, highlights, equipment, modifications, known_flaws) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        org.springframework.jdbc.support.KeyHolder keyHolder = new org.springframework.jdbc.support.GeneratedKeyHolder();
        jdbcTemplate.update((java.sql.Connection conn) -> {
            java.sql.PreparedStatement ps = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, vehicle.getVin().toUpperCase().trim());
            ps.setInt(2, vehicle.getYear());
            ps.setString(3, vehicle.getMake());
            ps.setString(4, vehicle.getModel());
            ps.setString(5, vehicle.getTrim());
            ps.setInt(6, vehicle.getMileage());
            ps.setString(7, vehicle.getTransmission());
            ps.setString(8, vehicle.getDrivetrain() != null ? vehicle.getDrivetrain() : "RWD");
            ps.setString(9, vehicle.getEngine() != null ? vehicle.getEngine() : "Standard Engine");
            ps.setString(10, vehicle.getExteriorColor());
            ps.setString(11, vehicle.getInteriorColor());
            ps.setString(12, vehicle.getBodyStyle() != null ? vehicle.getBodyStyle() : "Coupe");

            String[] highlightsArr = vehicle.getHighlights() != null ? vehicle.getHighlights().toArray(new String[0]) : new String[0];
            String[] equipmentArr = vehicle.getEquipment() != null ? vehicle.getEquipment().toArray(new String[0]) : new String[0];
            String[] modificationsArr = vehicle.getModifications() != null ? vehicle.getModifications().toArray(new String[0]) : new String[0];
            String[] knownFlawsArr = vehicle.getKnownFlaws() != null ? vehicle.getKnownFlaws().toArray(new String[0]) : new String[0];

            ps.setArray(13, conn.createArrayOf("text", highlightsArr));
            ps.setArray(14, conn.createArrayOf("text", equipmentArr));
            ps.setArray(15, conn.createArrayOf("text", modificationsArr));
            ps.setArray(16, conn.createArrayOf("text", knownFlawsArr));

            return ps;
        }, keyHolder);

        int newId = RepositoryUtils.getGeneratedId(keyHolder);
        return findById(newId).orElseThrow(() -> new IllegalStateException("Vehicle not found after creation"));
    }
}
