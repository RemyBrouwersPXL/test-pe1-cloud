package com.gearbids.auction;

import com.gearbids.auction.dto.AuthDto;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class AuthControllerTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    @Test
    void registerAndAuthenticateFlow() throws Exception {
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        AuthDto.RegisterRequest req = new AuthDto.RegisterRequest();
        req.setUsername("user_" + uniqueSuffix);
        req.setEmail("user_" + uniqueSuffix + "@example.com");
        req.setPassword("Password123!");
        req.setFullName("Test User");
        req.setLocation("Los Angeles, CA");
        req.setBio("Car enthusiast");

        // 1. Register new user
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.username").value(req.getUsername()))
                .andExpect(jsonPath("$.user.email").value(req.getEmail()))
                .andReturn();

        MockHttpSession session = (MockHttpSession) registerResult.getRequest().getSession();

        // 2. Fetch /api/auth/me with session
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.user.username").value(req.getUsername()));

        // 3. Logout
        mockMvc.perform(post("/api/auth/logout").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"));

        // 4. Fetch /api/auth/me after logout -> 401
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.authenticated").value(false));

        // 5. Login again with valid credentials
        AuthDto.LoginRequest loginReq = new AuthDto.LoginRequest();
        loginReq.setUsernameOrEmail(req.getEmail());
        loginReq.setPassword("Password123!");

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username").value(req.getUsername()))
                .andReturn();

        MockHttpSession newSession = (MockHttpSession) loginResult.getRequest().getSession();

        // 6. Login with invalid password -> 401
        AuthDto.LoginRequest badLogin = new AuthDto.LoginRequest();
        badLogin.setUsernameOrEmail(req.getEmail());
        badLogin.setPassword("WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLogin)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedMeReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.authenticated").value(false));
    }

    @Test
    void seededBcryptHashMatchesPassword123() {
        String seedHash = "$2a$10$HAuOvnFHpS.EAbaQhELbxeVHZL4pUldf/NmffJBdeE0rA3B4itHOm";
        org.junit.jupiter.api.Assertions.assertTrue(
                org.springframework.security.crypto.bcrypt.BCrypt.checkpw("password123", seedHash),
                "Seeded BCrypt hash in seed.sql must match 'password123'"
        );
    }

    @Test
    void loginWithUsernameAndEmailAliases() throws Exception {
        String uniqueSuffix = String.valueOf(System.nanoTime());
        AuthDto.RegisterRequest req = new AuthDto.RegisterRequest();
        req.setUsername("alias_" + uniqueSuffix);
        req.setEmail("alias_" + uniqueSuffix + "@example.com");
        req.setPassword("Password123!");
        req.setFullName("Alias Test User");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // Test login sending "username" instead of "usernameOrEmail"
        String usernameJson = String.format("{\"username\":\"%s\",\"password\":\"Password123!\"}", req.getUsername());
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(usernameJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username").value(req.getUsername()));

        // Test login sending "email" instead of "usernameOrEmail"
        String emailJson = String.format("{\"email\":\"%s\",\"password\":\"Password123!\"}", req.getEmail());
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(emailJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(req.getEmail()));
    }

    @Autowired
    private com.gearbids.auction.repository.UserRepository userRepository;

    @Test
    void legacySeedHashSelfHealsOnLogin() throws Exception {
        String uniqueSuffix = String.valueOf(System.nanoTime());
        String username = "legacy_" + uniqueSuffix;
        String email = "legacy_" + uniqueSuffix + "@example.com";
        com.gearbids.auction.model.User user = userRepository.create(
                username,
                email,
                "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekd87Fc85glNG.mSm",
                "Legacy Seed User",
                null,
                "Brussels"
        );

        AuthDto.LoginRequest loginReq = new AuthDto.LoginRequest();
        loginReq.setUsernameOrEmail(username);
        loginReq.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username").value(username));

        com.gearbids.auction.model.User updatedUser = userRepository.findById(user.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(
                "$2a$10$HAuOvnFHpS.EAbaQhELbxeVHZL4pUldf/NmffJBdeE0rA3B4itHOm",
                updatedUser.getPasswordHash()
        );
    }
}
