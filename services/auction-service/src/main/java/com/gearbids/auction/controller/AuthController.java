package com.gearbids.auction.controller;

import com.gearbids.auction.dto.AuthDto;
import com.gearbids.auction.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDto.AuthResponse> register(@Valid @RequestBody AuthDto.RegisterRequest req,
                                                         HttpServletRequest request) {
        AuthDto.AuthResponse response = authService.register(req, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDto.AuthResponse> login(@Valid @RequestBody AuthDto.LoginRequest req,
                                                      HttpServletRequest request) {
        AuthDto.AuthResponse response = authService.login(req, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request) {
        authService.logout(request);
        return ResponseEntity.ok(Collections.singletonMap("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDto.MeResponse> getCurrentUser(HttpServletRequest request) {
        try {
            AuthDto.UserDto user = authService.getCurrentUser(request);
            return ResponseEntity.ok(new AuthDto.MeResponse(true, user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new AuthDto.MeResponse(false, null));
        }
    }
}
