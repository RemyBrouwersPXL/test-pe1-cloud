package com.gearbids.auction.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class Bid {
    private Integer id;
    @JsonProperty("auction_id")
    private Integer auctionId;
    @JsonProperty("bidder_id")
    private Integer bidderId;
    private BigDecimal amount;
    @JsonProperty("created_at")
    private OffsetDateTime createdAt;
    @JsonProperty("bidder_username")
    private String bidderUsername;

    public Bid() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getAuctionId() { return auctionId; }
    public void setAuctionId(Integer auctionId) { this.auctionId = auctionId; }

    public Integer getBidderId() { return bidderId; }
    public void setBidderId(Integer bidderId) { this.bidderId = bidderId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public String getBidderUsername() { return bidderUsername; }
    public void setBidderUsername(String bidderUsername) { this.bidderUsername = bidderUsername; }
}
