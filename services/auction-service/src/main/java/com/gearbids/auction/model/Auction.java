package com.gearbids.auction.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public class Auction {
    private Integer id;
    @JsonProperty("vehicle_id")
    private Integer vehicleId;
    @JsonProperty("seller_id")
    private Integer sellerId;
    private String title;
    private String slug;
    private String description;
    @JsonProperty("dougs_take")
    private String dougsTake;
    @JsonProperty("starting_bid")
    private BigDecimal startingBid;
    @JsonProperty("current_bid")
    private BigDecimal currentBid;
    // SEC-13: Field has no direct JsonProperty to allow selective serialization via getter
    private BigDecimal reservePrice;
    @JsonProperty("is_no_reserve")
    private boolean isNoReserve;
    @JsonProperty("reserve_met")
    private boolean reserveMet;
    @JsonProperty("min_increment")
    private BigDecimal minIncrement;
    @JsonProperty("start_time")
    private OffsetDateTime startTime;
    @JsonProperty("end_time")
    private OffsetDateTime endTime;
    private AuctionStatus status;
    @JsonProperty("high_bidder_id")
    private Integer highBidderId;
    @JsonProperty("total_bids")
    private Integer totalBids;
    @JsonProperty("views_count")
    private Integer viewsCount;
    @JsonProperty("thumbnail_url")
    private String thumbnailUrl;
    @JsonProperty("gallery_images")
    private List<String> galleryImages = new ArrayList<>();
    private String location;
    @JsonProperty("created_at")
    private OffsetDateTime createdAt;
    @JsonProperty("updated_at")
    private OffsetDateTime updatedAt;

    // Joined vehicle details
    private Vehicle vehicle;

    // Joined user details
    @JsonProperty("seller_username")
    private String sellerUsername;
    @JsonProperty("high_bidder_username")
    private String highBidderUsername;

    public Auction() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getVehicleId() { return vehicleId; }
    public void setVehicleId(Integer vehicleId) { this.vehicleId = vehicleId; }

    public Integer getSellerId() { return sellerId; }
    public void setSellerId(Integer sellerId) { this.sellerId = sellerId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDougsTake() { return dougsTake; }
    public void setDougsTake(String dougsTake) { this.dougsTake = dougsTake; }

    public BigDecimal getStartingBid() { return startingBid; }
    public void setStartingBid(BigDecimal startingBid) { this.startingBid = startingBid; }

    public BigDecimal getCurrentBid() { return currentBid; }
    public void setCurrentBid(BigDecimal currentBid) { this.currentBid = currentBid; }

    // Internal raw reserve price access (bypasses JSON serialization)
    @JsonIgnore
    public BigDecimal getReservePrice() { return reservePrice; }

    // SEC-13: Redact secret reserve price in public JSON unless reserve has been met or listing is No Reserve
    @JsonProperty("reserve_price")
    public BigDecimal getPublicReservePrice() {
        if (this.isNoReserve || this.reserveMet) {
            return reservePrice;
        }
        return null;
    }

    @JsonProperty("reserve_price")
    public void setReservePrice(BigDecimal reservePrice) { this.reservePrice = reservePrice; }

    public boolean isNoReserve() { return isNoReserve; }
    public void setNoReserve(boolean noReserve) { isNoReserve = noReserve; }

    public boolean isReserveMet() { return reserveMet; }
    public void setReserveMet(boolean reserveMet) { this.reserveMet = reserveMet; }

    public BigDecimal getMinIncrement() { return minIncrement; }
    public void setMinIncrement(BigDecimal minIncrement) { this.minIncrement = minIncrement; }

    public OffsetDateTime getStartTime() { return startTime; }
    public void setStartTime(OffsetDateTime startTime) { this.startTime = startTime; }

    public OffsetDateTime getEndTime() { return endTime; }
    public void setEndTime(OffsetDateTime endTime) { this.endTime = endTime; }

    public AuctionStatus getStatus() { return status; }
    public void setStatus(AuctionStatus status) { this.status = status; }

    public Integer getHighBidderId() { return highBidderId; }
    public void setHighBidderId(Integer highBidderId) { this.highBidderId = highBidderId; }

    public Integer getTotalBids() { return totalBids; }
    public void setTotalBids(Integer totalBids) { this.totalBids = totalBids; }

    public Integer getViewsCount() { return viewsCount; }
    public void setViewsCount(Integer viewsCount) { this.viewsCount = viewsCount; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public List<String> getGalleryImages() { return galleryImages; }
    public void setGalleryImages(List<String> galleryImages) { this.galleryImages = galleryImages != null ? galleryImages : new ArrayList<>(); }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }

    public String getSellerUsername() { return sellerUsername; }
    public void setSellerUsername(String sellerUsername) { this.sellerUsername = sellerUsername; }

    public String getHighBidderUsername() { return highBidderUsername; }
    public void setHighBidderUsername(String highBidderUsername) { this.highBidderUsername = highBidderUsername; }
}
