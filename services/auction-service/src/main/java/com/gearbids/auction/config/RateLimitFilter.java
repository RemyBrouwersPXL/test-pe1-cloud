package com.gearbids.auction.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitFilter implements Filter {

    // SEC-14: Bounded in-memory rate limiter with TTL eviction to prevent memory leak / OOM
    private static final int MAX_ENTRIES = 10_000;
    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();

    private static class RequestCounter {
        long windowStart = System.currentTimeMillis();
        long windowDurationMs = 15 * 60 * 1000;
        AtomicInteger count = new AtomicInteger(0);

        RequestCounter(long windowDurationMs) {
            this.windowDurationMs = windowDurationMs;
        }
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (request instanceof HttpServletRequest httpRequest && response instanceof HttpServletResponse httpResponse) {
            String path = httpRequest.getRequestURI();
            String method = httpRequest.getMethod();

            boolean isAuthEndpoint = path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register");
            boolean isBidEndpoint = "POST".equalsIgnoreCase(method) && path.matches("^/api/auctions/\\d+/bid$");

            if (isAuthEndpoint || isBidEndpoint) {
                long now = System.currentTimeMillis();

                // Periodic eviction when table size exceeds threshold
                if (requestCounts.size() > 5000) {
                    pruneExpiredEntries(now);
                }

                if (requestCounts.size() >= MAX_ENTRIES) {
                    pruneExpiredEntries(now);
                }

                String clientIp = getClientIp(httpRequest);
                HttpSession session = httpRequest.getSession(false);
                String sessionPart = session != null ? session.getId() : "anon";

                long windowMs;
                int maxRequests;
                String action;

                if (isBidEndpoint) {
                    // SEC-14: Rate limit bidding to 30 requests/minute to prevent high-speed bot flooding
                    windowMs = 60 * 1000; // 1 minute
                    maxRequests = 30;
                    action = "bid:" + path;
                } else {
                    // Rate limit auth to 60 requests/15 minutes to prevent credential stuffing
                    windowMs = 15 * 60 * 1000; // 15 minutes
                    maxRequests = 60;
                    action = "auth";
                }

                String key = clientIp + ":" + sessionPart + ":" + action;

                RequestCounter counter = requestCounts.compute(key, (k, v) -> {
                    if (v == null || now - v.windowStart > v.windowDurationMs) {
                        RequestCounter fresh = new RequestCounter(windowMs);
                        fresh.count.set(1);
                        return fresh;
                    }
                    v.count.incrementAndGet();
                    return v;
                });

                if (counter.count.get() > maxRequests) {
                    httpResponse.setStatus(429);
                    httpResponse.setContentType("application/json");
                    httpResponse.getWriter().write("{\"error\":\"Too many requests. Please try again later.\"}");
                    return;
                }
            }
        }
        chain.doFilter(request, response);
    }

    private void pruneExpiredEntries(long now) {
        requestCounts.entrySet().removeIf(entry -> now - entry.getValue().windowStart > entry.getValue().windowDurationMs);
    }

    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        // SEC-14: Only trust X-Forwarded-For if request comes from a trusted internal proxy
        if (isTrustedProxy(remoteAddr)) {
            String xf = request.getHeader("X-Forwarded-For");
            if (xf != null && !xf.isEmpty()) {
                return xf.split(",")[0].trim();
            }
        }
        return remoteAddr != null ? remoteAddr : "unknown";
    }

    private boolean isTrustedProxy(String remoteAddr) {
        if (remoteAddr == null) return false;
        return remoteAddr.equals("127.0.0.1") ||
                remoteAddr.equals("::1") ||
                remoteAddr.equals("0:0:0:0:0:0:0:1") ||
                remoteAddr.startsWith("10.") ||
                remoteAddr.startsWith("172.") ||
                remoteAddr.startsWith("192.168.");
    }
}
