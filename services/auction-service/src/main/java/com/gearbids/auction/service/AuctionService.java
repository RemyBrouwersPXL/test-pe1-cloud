package com.gearbids.auction.service;

import com.gearbids.auction.dto.AuctionDto;
import com.gearbids.auction.dto.BidDto;
import com.gearbids.auction.dto.CommentDto;
import com.gearbids.auction.exception.ForbiddenException;
import com.gearbids.auction.exception.ResourceNotFoundException;
import com.gearbids.auction.exception.ValidationException;
import com.gearbids.auction.model.*;
import com.gearbids.auction.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Service
public class AuctionService {

    private final AuctionRepository auctionRepository;
    private final VehicleRepository vehicleRepository;
    private final BidRepository bidRepository;
    private final CommentRepository commentRepository;
    private final InspectionRepository inspectionRepository;
    private final NotificationRepository notificationRepository;
    private final InspectionClient inspectionClient;
    private final NotificationClient notificationClient;

    public AuctionService(AuctionRepository auctionRepository,
                          VehicleRepository vehicleRepository,
                          BidRepository bidRepository,
                          CommentRepository commentRepository,
                          InspectionRepository inspectionRepository,
                          NotificationRepository notificationRepository,
                          InspectionClient inspectionClient,
                          NotificationClient notificationClient) {
        this.auctionRepository = auctionRepository;
        this.vehicleRepository = vehicleRepository;
        this.bidRepository = bidRepository;
        this.commentRepository = commentRepository;
        this.inspectionRepository = inspectionRepository;
        this.notificationRepository = notificationRepository;
        this.inspectionClient = inspectionClient;
        this.notificationClient = notificationClient;
    }

    private String slugify(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                .replaceAll("[^\\w\\s-]", "")
                .replaceAll("[\\s_-]+", "-")
                .replaceAll("^-+|-+$", "");
    }

    public AuctionDto.AuctionListResponse listAuctions(String status, String make, String bodyStyle,
                                                       String transmission, String search, String sort,
                                                       int limit, int offset) {
        int safeLimit = limit > 0 && limit <= 100 ? limit : 20;
        int safeOffset = Math.max(offset, 0);

        List<Auction> auctions = auctionRepository.listWithFilters(
                status, make, bodyStyle, transmission, search, sort, safeLimit, safeOffset
        );
        long count = auctionRepository.countWithFilters(status, make, bodyStyle, transmission, search);

        return new AuctionDto.AuctionListResponse(auctions, count);
    }

    public AuctionDto.AuctionDetailResponse getAuctionDetail(String idOrSlug) {
        Auction auction = auctionRepository.findByIdOrSlug(idOrSlug)
                .orElseThrow(() -> new ResourceNotFoundException("Auction listing not found"));

        auctionRepository.incrementViews(auction.getId());

        List<Bid> bids = bidRepository.findByAuctionId(auction.getId());
        List<Comment> comments = commentRepository.findByAuctionId(auction.getId());
        Map<String, Object> inspection = inspectionRepository.findLatestByVehicleId(auction.getVehicleId()).orElse(null);

        return new AuctionDto.AuctionDetailResponse(auction, bids, comments, inspection);
    }

    public AuctionDto.AuctionStatsResponse getStats() {
        return auctionRepository.getStats();
    }

    @Transactional
    public Auction createAuction(AuctionDto.CreateAuctionRequest req, int sellerId) {
        Vehicle vehicle = new Vehicle();
        vehicle.setVin(req.getVin().toUpperCase().trim());
        vehicle.setYear(req.getYear());
        vehicle.setMake(req.getMake());
        vehicle.setModel(req.getModel());
        vehicle.setTrim(req.getTrim());
        vehicle.setMileage(req.getMileage());
        vehicle.setTransmission(req.getTransmission());
        vehicle.setDrivetrain(req.getDrivetrain() != null ? req.getDrivetrain() : "RWD");
        vehicle.setEngine(req.getEngine() != null ? req.getEngine() : "Standard Engine");
        vehicle.setExteriorColor(req.getExteriorColor() != null ? req.getExteriorColor() : "Unknown");
        vehicle.setInteriorColor(req.getInteriorColor() != null ? req.getInteriorColor() : "Unknown");
        vehicle.setBodyStyle(req.getBodyStyle() != null ? req.getBodyStyle() : "Coupe");
        vehicle.setHighlights(req.getHighlights());
        vehicle.setEquipment(req.getEquipment());
        vehicle.setModifications(req.getModifications());
        vehicle.setKnownFlaws(req.getKnownFlaws());

        Vehicle savedVehicle = vehicleRepository.create(vehicle);

        String baseSlug = slugify(req.getYear() + "-" + req.getMake() + "-" + req.getModel() + "-" + savedVehicle.getId());
        String listingTitle = req.getTitle() != null && !req.getTitle().isBlank()
                ? req.getTitle().trim()
                : (req.getYear() + " " + req.getMake() + " " + req.getModel() + (req.getTrim() != null ? " " + req.getTrim() : "")).trim();

        OffsetDateTime startTime = OffsetDateTime.now();
        int durationDays = req.getDurationDays() > 0 ? req.getDurationDays() : 7;
        OffsetDateTime endTime = startTime.plusDays(durationDays);

        BigDecimal startingBid = req.getStartingBid() != null ? req.getStartingBid() : BigDecimal.valueOf(1000.00);
        BigDecimal reservePrice = req.isNoReserve() ? null : req.getReservePrice();
        boolean reserveMet = req.isNoReserve();

        Auction auction = new Auction();
        auction.setVehicleId(savedVehicle.getId());
        auction.setSellerId(sellerId);
        auction.setTitle(listingTitle);
        auction.setSlug(baseSlug);
        auction.setDescription(req.getDescription() != null ? req.getDescription() : "No description provided.");
        auction.setDougsTake(req.getDougsTake());
        auction.setStartingBid(startingBid);
        auction.setCurrentBid(startingBid);
        auction.setReservePrice(reservePrice);
        auction.setNoReserve(req.isNoReserve());
        auction.setReserveMet(reserveMet);
        auction.setMinIncrement(req.getMinIncrement() != null ? req.getMinIncrement() : BigDecimal.valueOf(100.00));
        auction.setStartTime(startTime);
        auction.setEndTime(endTime);
        auction.setStatus(AuctionStatus.ACTIVE);
        auction.setThumbnailUrl(req.getThumbnailUrl() != null ? req.getThumbnailUrl() : "https://images.unsplash.com/photo-1503376780353-7e6692767b70");
        auction.setGalleryImages(req.getGalleryImages());
        auction.setLocation(req.getLocation() != null ? req.getLocation() : "Unknown");

        Auction savedAuction = auctionRepository.create(auction);
        savedAuction.setVehicle(savedVehicle);

        // Async automated valuation dispatch to inspection-service (SEC-07: internal endpoint + service token)
        inspectionClient.requestInspection(
                savedVehicle.getId(),
                savedVehicle.getVin(),
                savedVehicle.getYear(),
                savedVehicle.getMake(),
                savedVehicle.getModel(),
                savedVehicle.getMileage()
        );

        return savedAuction;
    }

    @Transactional
    public BidDto.BidResponse placeBid(int auctionId, BigDecimal bidAmount, int bidderId) {
        if (bidAmount == null || bidAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Valid bid amount required");
        }

        // 1. Concurrency lock (SELECT ... FOR UPDATE)
        Auction auction = auctionRepository.findByIdForUpdate(auctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Auction not found"));

        // 2. Validate status
        if (auction.getStatus() != AuctionStatus.ACTIVE) {
            throw new ValidationException("Cannot bid: auction is currently " + auction.getStatus());
        }

        OffsetDateTime now = OffsetDateTime.now();
        if (!now.isBefore(auction.getEndTime())) {
            throw new ValidationException("Auction has already ended");
        }

        // 3. Anti-shill check: seller cannot bid on own listing
        if (auction.getSellerId() != null && auction.getSellerId() == bidderId) {
            throw new ForbiddenException("Sellers are not permitted to bid on their own listings");
        }

        // 4. Minimum increment calculation
        BigDecimal currentBid = auction.getCurrentBid();
        BigDecimal minIncrement = auction.getMinIncrement() != null ? auction.getMinIncrement() : BigDecimal.valueOf(100.00);
        BigDecimal minAllowed = auction.getTotalBids() == 0 ? currentBid : currentBid.add(minIncrement);

        if (bidAmount.compareTo(minAllowed) < 0) {
            throw new ValidationException("Bid must be at least $" + minAllowed + " (minimum increment: $" + minIncrement + ")");
        }

        // 5. Already high bidder
        if (auction.getHighBidderId() != null && auction.getHighBidderId() == bidderId) {
            throw new ValidationException("You are already the highest bidder");
        }

        Integer previousHighBidderId = auction.getHighBidderId();

        // 6. Reserve price verification
        boolean reserveMet = auction.isReserveMet();
        if (!reserveMet && auction.getReservePrice() != null && bidAmount.compareTo(auction.getReservePrice()) >= 0) {
            reserveMet = true;
        }
        if (auction.isNoReserve()) {
            reserveMet = true;
        }

        // 7. Anti-Sniping logic: if bid is within 120s of end_time, extend by 120s!
        long remainingSeconds = Duration.between(now, auction.getEndTime()).getSeconds();
        boolean antiSnipingTriggered = false;
        OffsetDateTime newEndTime = auction.getEndTime();

        if (remainingSeconds <= 120) {
            antiSnipingTriggered = true;
            newEndTime = newEndTime.plusSeconds(120);
        }

        // 8. Insert bid record
        Bid bid = bidRepository.create(auctionId, bidderId, bidAmount);

        // 9. Update auction record
        Auction updatedAuction = auctionRepository.updateBidAndAntiSniping(
                auctionId, bidAmount, bidderId, reserveMet, newEndTime
        );

        // 10. Asynchronously notify previous high bidder
        if (previousHighBidderId != null && previousHighBidderId != bidderId) {
            String metadataJson = String.format("{\"auction_id\":%d,\"new_bid\":%s}", auctionId, bidAmount);
            notificationRepository.createOutbidNotification(
                    previousHighBidderId,
                    auctionId,
                    "Outbid on " + auction.getTitle() + "!",
                    "Another bidder placed a higher bid of $" + bidAmount + ".",
                    metadataJson
            );

            notificationClient.notifyOutbid(
                    previousHighBidderId,
                    auctionId,
                    auction.getTitle(),
                    bidAmount,
                    newEndTime
            );
        }

        return new BidDto.BidResponse("Bid placed successfully!", bid, updatedAuction, antiSnipingTriggered, newEndTime);
    }

    public Comment postComment(int auctionId, CommentDto.PostCommentRequest req, int userId) {
        if (req.getContent() == null || req.getContent().isBlank()) {
            throw new ValidationException("Comment content cannot be empty");
        }

        Auction auction = auctionRepository.findByIdOrSlug(String.valueOf(auctionId))
                .orElseThrow(() -> new ResourceNotFoundException("Auction listing not found"));

        boolean isSeller = auction.getSellerId() != null && auction.getSellerId() == userId;
        return commentRepository.create(
                auctionId,
                userId,
                req.getParentCommentId(),
                req.getContent().trim(),
                isSeller
        );
    }
}
