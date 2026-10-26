package com.gearbids.auction.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class NotificationClient {

    private static final Logger log = LoggerFactory.getLogger(NotificationClient.class);
    private final RestTemplate restTemplate;

    public NotificationClient() {
        // SEC-17: Configure explicit connect (3s) and read (5s) timeouts to prevent thread starvation
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Value("${app.services.notifications-url}")
    private String notificationsUrl;

    @Value("${app.security.internal-service-token}")
    private String internalServiceToken;

    @Async
    public void notifyOutbid(int recipientUserId, int auctionId, String auctionTitle, BigDecimal newBidAmount, OffsetDateTime newEndTime) {
        try {
            String url = notificationsUrl + "/internal/events";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Service-Token", internalServiceToken);

            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "OUTBID");
            payload.put("recipient_user_id", recipientUserId);
            payload.put("auction_id", auctionId);
            payload.put("auction_title", auctionTitle);
            payload.put("new_bid_amount", newBidAmount);
            payload.put("new_end_time", newEndTime != null ? newEndTime.toString() : null);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            restTemplate.postForEntity(url, request, String.class);
            log.info("Dispatched OUTBID notification for user #{} on auction #{}", recipientUserId, auctionId);
        } catch (Exception e) {
            log.warn("Could not dispatch notification to {}: {}", notificationsUrl, e.getMessage());
        }
    }
}
