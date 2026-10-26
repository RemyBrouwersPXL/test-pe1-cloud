package com.gearbids.auction;

import com.gearbids.auction.dto.AuctionDto;
import com.gearbids.auction.dto.AuthDto;
import com.gearbids.auction.dto.BidDto;
import com.gearbids.auction.dto.CommentDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class AuctionControllerTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private MockHttpSession sellerSession;
    private MockHttpSession bidderSession;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        String sellerSuffix = String.valueOf(System.nanoTime());
        AuthDto.RegisterRequest sellerReq = new AuthDto.RegisterRequest();
        sellerReq.setUsername("seller_" + sellerSuffix);
        sellerReq.setEmail("seller_" + sellerSuffix + "@example.com");
        sellerReq.setPassword("Password123!");
        sellerReq.setFullName("Seller User");

        MvcResult sellerRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sellerReq)))
                .andExpect(status().isCreated())
                .andReturn();
        sellerSession = (MockHttpSession) sellerRes.getRequest().getSession();

        String bidderSuffix = String.valueOf(System.nanoTime());
        AuthDto.RegisterRequest bidderReq = new AuthDto.RegisterRequest();
        bidderReq.setUsername("bidder_" + bidderSuffix);
        bidderReq.setEmail("bidder_" + bidderSuffix + "@example.com");
        bidderReq.setPassword("Password123!");
        bidderReq.setFullName("Bidder User");

        MvcResult bidderRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bidderReq)))
                .andExpect(status().isCreated())
                .andReturn();
        bidderSession = (MockHttpSession) bidderRes.getRequest().getSession();
    }

    @Test
    void listAuctionsAndStats() throws Exception {
        mockMvc.perform(get("/api/auctions"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.auctions").isArray());

        mockMvc.perform(get("/api/auctions/stats"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.active_auctions").isNumber())
                .andExpect(jsonPath("$.total_bids").isNumber());
    }

    @Test
    void createAuctionRequiresAuth() throws Exception {
        AuctionDto.CreateAuctionRequest req = new AuctionDto.CreateAuctionRequest();
        req.setVin("WP0AB2A99NS123456");
        req.setYear(2021);
        req.setMake("Porsche");
        req.setModel("911 GT3");
        req.setMileage(5000);
        req.setTransmission("Manual");
        req.setStartingBid(BigDecimal.valueOf(100000));
        req.setTitle("2021 Porsche 911 GT3");
        mockMvc.perform(post("/api/auctions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createAuctionBiddingAndCommentsFlow() throws Exception {
        String testVin = "WP0AB2A99NS" + (System.currentTimeMillis() % 1000000);
        while (testVin.length() < 17) {
            testVin += "0";
        }

        AuctionDto.CreateAuctionRequest req = new AuctionDto.CreateAuctionRequest();
        req.setVin(testVin);
        req.setYear(2021);
        req.setMake("Porsche");
        req.setModel("911 GT3");
        req.setTrim("Clubsport");
        req.setMileage(4200);
        req.setTransmission("6-Speed Manual");
        req.setDrivetrain("RWD");
        req.setEngine("4.0L Naturally Aspirated Boxer-6");
        req.setExteriorColor("Shark Blue");
        req.setInteriorColor("Black Leather / Race-Tex");
        req.setBodyStyle("Coupe");
        req.setHighlights(List.of("Carbon ceramics", "Front axle lift system"));
        req.setEquipment(List.of("Chrono package", "LED Matrix headlights"));
        req.setModifications(List.of("Clear bra paint protection"));
        req.setKnownFlaws(List.of("Minor stone chip on lower splitter"));

        req.setTitle("2021 Porsche 911 GT3 Shark Blue");
        req.setDescription("Pristine low-mileage GT3 with enthusiast spec.");
        req.setDougsTake("This is peak naturally aspirated 911. The Shark Blue looks unbelievable in person.");
        req.setStartingBid(BigDecimal.valueOf(150000.00));
        req.setReservePrice(BigDecimal.valueOf(175000.00));
        req.setNoReserve(false);
        req.setMinIncrement(BigDecimal.valueOf(1000.00));
        req.setDurationDays(7);
        req.setThumbnailUrl("https://example.com/porsche-thumb.jpg");
        req.setGalleryImages(List.of("https://example.com/p1.jpg", "https://example.com/p2.jpg"));
        req.setLocation("Austin, TX");

        // 1. Create Auction
        MvcResult createResult = mockMvc.perform(post("/api/auctions")
                        .session(sellerSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Auction created successfully"))
                .andExpect(jsonPath("$.auction.id").isNumber())
                .andExpect(jsonPath("$.auction.slug").isString())
                .andReturn();

        String respStr = createResult.getResponse().getContentAsString();
        int auctionId = objectMapper.readTree(respStr).path("auction").path("id").asInt();
        String slug = objectMapper.readTree(respStr).path("auction").path("slug").asText();

        // 2. Fetch auction detail by ID and by Slug (SEC-13: verify reserve_price is redacted/null)
        mockMvc.perform(get("/api/auctions/" + auctionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.auction.title").value(req.getTitle()))
                .andExpect(jsonPath("$.auction.vehicle.vin").value(testVin))
                .andExpect(jsonPath("$.auction.reserve_price").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.auction.reserve_met").value(false))
                .andExpect(jsonPath("$.bids").isArray())
                .andExpect(jsonPath("$.comments").isArray());

        mockMvc.perform(get("/api/auctions/" + slug))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.auction.id").value(auctionId));

        // 3. Bid without auth -> 401
        BidDto.PlaceBidRequest bidReq = new BidDto.PlaceBidRequest();
        bidReq.setAmount(BigDecimal.valueOf(155000.00));

        mockMvc.perform(post("/api/auctions/" + auctionId + "/bid")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bidReq)))
                .andExpect(status().isUnauthorized());

        // 4. Bid lower than starting bid + increment -> 400
        BidDto.PlaceBidRequest lowBidReq = new BidDto.PlaceBidRequest();
        lowBidReq.setAmount(BigDecimal.valueOf(100.00));

        mockMvc.perform(post("/api/auctions/" + auctionId + "/bid")
                        .session(bidderSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(lowBidReq)))
                .andExpect(status().isBadRequest());

        // 5. Valid Bid -> 200 OK
        mockMvc.perform(post("/api/auctions/" + auctionId + "/bid")
                        .session(bidderSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bidReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Bid placed successfully!"))
                .andExpect(jsonPath("$.auction.current_bid").value(155000.00))
                .andExpect(jsonPath("$.auction.total_bids").value(1));

        // 6. Post comment
        CommentDto.PostCommentRequest commentReq = new CommentDto.PostCommentRequest();
        commentReq.setContent("Does this car have DME report available?");

        mockMvc.perform(post("/api/auctions/" + auctionId + "/comments")
                        .session(bidderSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(commentReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Comment posted successfully"))
                .andExpect(jsonPath("$.comment.content").value(commentReq.getContent()));
    }
}
