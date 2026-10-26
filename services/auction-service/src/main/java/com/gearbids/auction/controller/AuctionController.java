package com.gearbids.auction.controller;

import com.gearbids.auction.dto.AuctionDto;
import com.gearbids.auction.dto.BidDto;
import com.gearbids.auction.dto.CommentDto;
import com.gearbids.auction.exception.UnauthorizedException;
import com.gearbids.auction.model.Auction;
import com.gearbids.auction.model.Comment;
import com.gearbids.auction.service.AuctionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auctions")
public class AuctionController {

    private final AuctionService auctionService;

    public AuctionController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }

    private Integer getAuthenticatedUserId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            throw new UnauthorizedException("You must be logged in to perform this action. Active session cookie required.");
        }
        return (Integer) session.getAttribute("userId");
    }

    @GetMapping
    public ResponseEntity<AuctionDto.AuctionListResponse> listAuctions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String make,
            @RequestParam(name = "body_style", required = false) String bodyStyle,
            @RequestParam(required = false) String transmission,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset) {

        AuctionDto.AuctionListResponse response = auctionService.listAuctions(
                status, make, bodyStyle, transmission, search, sort, limit, offset
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<AuctionDto.AuctionStatsResponse> getStats() {
        return ResponseEntity.ok(auctionService.getStats());
    }

    @GetMapping("/{idOrSlug}")
    public ResponseEntity<AuctionDto.AuctionDetailResponse> getAuctionDetail(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(auctionService.getAuctionDetail(idOrSlug));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createAuction(
            @Valid @RequestBody AuctionDto.CreateAuctionRequest req,
            HttpServletRequest request) {

        Integer sellerId = getAuthenticatedUserId(request);
        Auction created = auctionService.createAuction(req, sellerId);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Auction created successfully");
        response.put("auction", created);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/bid")
    public ResponseEntity<BidDto.BidResponse> placeBid(
            @PathVariable int id,
            @Valid @RequestBody BidDto.PlaceBidRequest req,
            HttpServletRequest request) {

        Integer bidderId = getAuthenticatedUserId(request);
        BidDto.BidResponse response = auctionService.placeBid(id, req.getAmount(), bidderId);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentDto.CommentResponse> postComment(
            @PathVariable int id,
            @Valid @RequestBody CommentDto.PostCommentRequest req,
            HttpServletRequest request) {

        Integer userId = getAuthenticatedUserId(request);
        Comment comment = auctionService.postComment(id, req, userId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new CommentDto.CommentResponse("Comment posted successfully", comment));
    }
}
