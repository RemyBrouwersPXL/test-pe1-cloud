package com.gearbids.auction.controller;

import com.gearbids.auction.dto.HealthDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HealthController {

    private final long startTime = ManagementFactory.getRuntimeMXBean().getStartTime();

    @Value("${app.version:1.0.0}")
    private String version;

    @Value("${app.release-tag:v1.0.0}")
    private String releaseTag;

    @Value("${app.git-commit:unknown}")
    private String gitCommit;

    @GetMapping({"/health", "/api/health"})
    public ResponseEntity<HealthDto> health() {
        long uptimeSeconds = (System.currentTimeMillis() - startTime) / 1000;
        HealthDto dto = new HealthDto(
                "healthy",
                "gearbids-auction-service",
                version,
                releaseTag,
                gitCommit,
                Instant.now().toString(),
                uptimeSeconds
        );
        return ResponseEntity.ok(dto);
    }

    @GetMapping({"/version", "/api/version"})
    public ResponseEntity<Map<String, Object>> version() {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("service", "gearbids-auction-service");
        resp.put("version", version);
        resp.put("release_tag", releaseTag);
        resp.put("git_commit", gitCommit);
        resp.put("status", "healthy");
        resp.put("runtime", System.getProperty("java.version"));
        return ResponseEntity.ok(resp);
    }
}
