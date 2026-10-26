package com.gearbids.auction.repository;

import org.springframework.jdbc.support.KeyHolder;

import java.util.Map;

public final class RepositoryUtils {

    private RepositoryUtils() {}

    public static int getGeneratedId(KeyHolder keyHolder) {
        Map<String, Object> keys = null;
        try {
            keys = keyHolder.getKeys();
        } catch (Exception ignored) {}

        if (keys != null) {
            if (keys.get("id") instanceof Number) {
                return ((Number) keys.get("id")).intValue();
            }
            if (keys.get("ID") instanceof Number) {
                return ((Number) keys.get("ID")).intValue();
            }
            for (Object val : keys.values()) {
                if (val instanceof Number) {
                    return ((Number) val).intValue();
                }
            }
        }

        try {
            Number singleKey = keyHolder.getKey();
            if (singleKey != null) {
                return singleKey.intValue();
            }
        } catch (Exception ignored) {}

        throw new IllegalStateException("Failed to retrieve generated ID from KeyHolder: " + keys);
    }
}
