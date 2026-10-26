package com.gearbids.auction.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.gearbids.auction.model.Auction;
import com.gearbids.auction.model.Bid;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class BidDto {

    public static class PlaceBidRequest {
        @NotNull(message = "Valid bid amount required")
        private BigDecimal amount;

        public PlaceBidRequest() {}
        public PlaceBidRequest(BigDecimal amount) { this.amount = amount; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }

    public static class BidResponse {
        private String message;
        private Bid bid;
        private Auction auction;
        @JsonProperty("anti_sniping_extended")
        private boolean antiSnipingExtended;
        @JsonProperty("new_end_time")
        private OffsetDateTime newEndTime;

        public BidResponse() {}
        public BidResponse(String message, Bid bid, Auction auction, boolean antiSnipingExtended, OffsetDateTime newEndTime) {
            this.message = message;
            this.bid = bid;
            this.auction = auction;
            this.antiSnipingExtended = antiSnipingExtended;
            this.newEndTime = newEndTime;
        }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public Bid getBid() { return bid; }
        public void setBid(Bid bid) { this.bid = bid; }

        public Auction getAuction() { return auction; }
        public void setAuction(Auction auction) { this.auction = auction; }

        public boolean isAntiSnipingExtended() { return antiSnipingExtended; }
        public void setAntiSnipingExtended(boolean antiSnipingExtended) { this.antiSnipingExtended = antiSnipingExtended; }

        public OffsetDateTime getNewEndTime() { return newEndTime; }
        public void setNewEndTime(OffsetDateTime newEndTime) { this.newEndTime = newEndTime; }
    }
}
