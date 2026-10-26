package com.gearbids.auction.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.gearbids.auction.model.Auction;
import com.gearbids.auction.model.Bid;
import com.gearbids.auction.model.Comment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class AuctionDto {

    public static class CreateAuctionRequest {
        @NotBlank(message = "VIN is required")
        private String vin;

        @NotNull(message = "Year is required")
        private Integer year;

        @NotBlank(message = "Make is required")
        private String make;

        @NotBlank(message = "Model is required")
        private String model;

        private String trim;

        @NotNull(message = "Mileage is required")
        private Integer mileage;

        @NotBlank(message = "Transmission is required")
        private String transmission;

        private String drivetrain = "RWD";
        private String engine = "Standard Engine";

        @JsonProperty("exterior_color")
        private String exteriorColor;

        @JsonProperty("interior_color")
        private String interiorColor;

        @JsonProperty("body_style")
        private String bodyStyle = "Coupe";

        private List<String> highlights = new ArrayList<>();
        private List<String> equipment = new ArrayList<>();
        private List<String> modifications = new ArrayList<>();

        @JsonProperty("known_flaws")
        private List<String> knownFlaws = new ArrayList<>();

        private String title;
        private String description = "No description provided.";

        @JsonProperty("dougs_take")
        private String dougsTake;

        @NotNull(message = "Starting bid is required")
        @JsonProperty("starting_bid")
        private BigDecimal startingBid;

        @JsonProperty("reserve_price")
        private BigDecimal reservePrice;

        @JsonProperty("is_no_reserve")
        private boolean isNoReserve;

        @JsonProperty("min_increment")
        private BigDecimal minIncrement;

        @JsonProperty("duration_days")
        private int durationDays = 7;

        @JsonProperty("thumbnail_url")
        private String thumbnailUrl;

        @JsonProperty("gallery_images")
        private List<String> galleryImages = new ArrayList<>();

        private String location = "Unknown";

        public CreateAuctionRequest() {}

        public String getVin() { return vin; }
        public void setVin(String vin) { this.vin = vin; }

        public Integer getYear() { return year; }
        public void setYear(Integer year) { this.year = year; }

        public String getMake() { return make; }
        public void setMake(String make) { this.make = make; }

        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }

        public String getTrim() { return trim; }
        public void setTrim(String trim) { this.trim = trim; }

        public Integer getMileage() { return mileage; }
        public void setMileage(Integer mileage) { this.mileage = mileage; }

        public String getTransmission() { return transmission; }
        public void setTransmission(String transmission) { this.transmission = transmission; }

        public String getDrivetrain() { return drivetrain; }
        public void setDrivetrain(String drivetrain) { this.drivetrain = drivetrain; }

        public String getEngine() { return engine; }
        public void setEngine(String engine) { this.engine = engine; }

        public String getExteriorColor() { return exteriorColor; }
        public void setExteriorColor(String exteriorColor) { this.exteriorColor = exteriorColor; }

        public String getInteriorColor() { return interiorColor; }
        public void setInteriorColor(String interiorColor) { this.interiorColor = interiorColor; }

        public String getBodyStyle() { return bodyStyle; }
        public void setBodyStyle(String bodyStyle) { this.bodyStyle = bodyStyle; }

        public List<String> getHighlights() { return highlights; }
        public void setHighlights(List<String> highlights) { this.highlights = highlights != null ? highlights : new ArrayList<>(); }

        public List<String> getEquipment() { return equipment; }
        public void setEquipment(List<String> equipment) { this.equipment = equipment != null ? equipment : new ArrayList<>(); }

        public List<String> getModifications() { return modifications; }
        public void setModifications(List<String> modifications) { this.modifications = modifications != null ? modifications : new ArrayList<>(); }

        public List<String> getKnownFlaws() { return knownFlaws; }
        public void setKnownFlaws(List<String> knownFlaws) { this.knownFlaws = knownFlaws != null ? knownFlaws : new ArrayList<>(); }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getDougsTake() { return dougsTake; }
        public void setDougsTake(String dougsTake) { this.dougsTake = dougsTake; }

        public BigDecimal getStartingBid() { return startingBid; }
        public void setStartingBid(BigDecimal startingBid) { this.startingBid = startingBid; }

        public BigDecimal getReservePrice() { return reservePrice; }
        public void setReservePrice(BigDecimal reservePrice) { this.reservePrice = reservePrice; }

        public boolean isNoReserve() { return isNoReserve; }
        public void setNoReserve(boolean noReserve) { isNoReserve = noReserve; }

        public BigDecimal getMinIncrement() { return minIncrement; }
        public void setMinIncrement(BigDecimal minIncrement) { this.minIncrement = minIncrement; }

        public int getDurationDays() { return durationDays; }
        public void setDurationDays(int durationDays) { this.durationDays = durationDays; }

        public String getThumbnailUrl() { return thumbnailUrl; }
        public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

        public List<String> getGalleryImages() { return galleryImages; }
        public void setGalleryImages(List<String> galleryImages) { this.galleryImages = galleryImages != null ? galleryImages : new ArrayList<>(); }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
    }

    public static class AuctionListResponse {
        private List<Auction> auctions;
        private long count;

        public AuctionListResponse() {}
        public AuctionListResponse(List<Auction> auctions, long count) {
            this.auctions = auctions;
            this.count = count;
        }

        public List<Auction> getAuctions() { return auctions; }
        public void setAuctions(List<Auction> auctions) { this.auctions = auctions; }

        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
    }

    public static class AuctionDetailResponse {
        private Auction auction;
        private List<Bid> bids;
        private List<Comment> comments;
        private Map<String, Object> inspection;

        public AuctionDetailResponse() {}
        public AuctionDetailResponse(Auction auction, List<Bid> bids, List<Comment> comments, Map<String, Object> inspection) {
            this.auction = auction;
            this.bids = bids;
            this.comments = comments;
            this.inspection = inspection;
        }

        public Auction getAuction() { return auction; }
        public void setAuction(Auction auction) { this.auction = auction; }

        public List<Bid> getBids() { return bids; }
        public void setBids(List<Bid> bids) { this.bids = bids; }

        public List<Comment> getComments() { return comments; }
        public void setComments(List<Comment> comments) { this.comments = comments; }

        public Map<String, Object> getInspection() { return inspection; }
        public void setInspection(Map<String, Object> inspection) { this.inspection = inspection; }
    }

    public static class AuctionStatsResponse {
        @JsonProperty("active_auctions")
        private long activeAuctions;

        @JsonProperty("total_bids")
        private long totalBids;

        @JsonProperty("total_volume")
        private BigDecimal totalVolume;

        @JsonProperty("cars_sold")
        private long carsSold;

        public AuctionStatsResponse() {}
        public AuctionStatsResponse(long activeAuctions, long totalBids, BigDecimal totalVolume, long carsSold) {
            this.activeAuctions = activeAuctions;
            this.totalBids = totalBids;
            this.totalVolume = totalVolume;
            this.carsSold = carsSold;
        }

        public long getActiveAuctions() { return activeAuctions; }
        public void setActiveAuctions(long activeAuctions) { this.activeAuctions = activeAuctions; }

        public long getTotalBids() { return totalBids; }
        public void setTotalBids(long totalBids) { this.totalBids = totalBids; }

        public BigDecimal getTotalVolume() { return totalVolume; }
        public void setTotalVolume(BigDecimal totalVolume) { this.totalVolume = totalVolume; }

        public long getCarsSold() { return carsSold; }
        public void setCarsSold(long carsSold) { this.carsSold = carsSold; }
    }
}
