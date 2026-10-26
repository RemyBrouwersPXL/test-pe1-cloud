package com.gearbids.auction.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Executes startup data migrations, ensuring existing persistent database volumes
 * have valid cryptographic password hashes for seeded evaluation and demo accounts.
 */
@Component
public class DatabaseMigrationRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationRunner.class);
    private static final String LEGACY_SEED_HASH = "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekd87Fc85glNG.mSm";
    private static final String VALID_SEED_HASH = "$2a$10$HAuOvnFHpS.EAbaQhELbxeVHZL4pUldf/NmffJBdeE0rA3B4itHOm";

    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            int updated = jdbcTemplate.update(
                    "UPDATE users SET password_hash = ? WHERE password_hash = ?",
                    VALID_SEED_HASH,
                    LEGACY_SEED_HASH
            );
            if (updated > 0) {
                log.info("DatabaseMigrationRunner: Upgraded {} seeded user account(s) from legacy invalid password hash to verified BCrypt hash.", updated);
            }
        } catch (Exception e) {
            log.debug("DatabaseMigrationRunner: Startup migration check skipped: {}", e.getMessage());
        }
    }
}
