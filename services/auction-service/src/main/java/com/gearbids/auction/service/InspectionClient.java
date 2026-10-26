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

import java.util.HashMap;
import java.util.Map;

@Service
public class InspectionClient {

    private static final Logger log = LoggerFactory.getLogger(InspectionClient.class);
    private final RestTemplate restTemplate;

    public InspectionClient() {
        // SEC-17: Configure explicit connect (3s) and read (5s) timeouts to prevent thread starvation
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Value("${app.services.inspections-url}")
    private String inspectionsUrl;

    @Value("${app.security.internal-service-token}")
    private String internalServiceToken;

    @Async
    public void requestInspection(int vehicleId, String vin, int year, String make, String model, int mileage) {
        try {
            String url = inspectionsUrl + "/internal/inspect";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Service-Token", internalServiceToken);

            Map<String, Object> payload = new HashMap<>();
            payload.put("vehicle_id", vehicleId);
            payload.put("vin", vin);
            payload.put("year", year);
            payload.put("make", make);
            payload.put("model", model);
            payload.put("mileage", mileage);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            restTemplate.postForEntity(url, request, String.class);
            log.info("Dispatched inspection request for vehicle ID {} (VIN: {})", vehicleId, vin);
        } catch (Exception e) {
            log.warn("Could not dispatch inspection request to {}: {}", inspectionsUrl, e.getMessage());
        }
    }
}
