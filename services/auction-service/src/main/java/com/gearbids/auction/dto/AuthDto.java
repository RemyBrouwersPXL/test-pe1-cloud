package com.gearbids.auction.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.gearbids.auction.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public class AuthDto {

    public static class RegisterRequest {
        @NotBlank(message = "Username is required")
        private String username;

        @NotBlank(message = "Email is required")
        @Email(message = "Valid email address required")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters in length")
        private String password;

        @NotBlank(message = "Full name is required")
        @JsonProperty("full_name")
        @JsonAlias({"fullName"})
        private String fullName;

        private String location;
        private String bio;

        public RegisterRequest() {}

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public String getBio() { return bio; }
        public void setBio(String bio) { this.bio = bio; }
    }

    public static class LoginRequest {
        @NotBlank(message = "Username or email is required")
        @JsonAlias({"username", "email"})
        private String usernameOrEmail;

        @NotBlank(message = "Password is required")
        private String password;

        public LoginRequest() {}

        public String getUsernameOrEmail() { return usernameOrEmail; }
        public void setUsernameOrEmail(String usernameOrEmail) { this.usernameOrEmail = usernameOrEmail; }

        @JsonProperty("username")
        public void setUsername(String username) {
            if (this.usernameOrEmail == null || this.usernameOrEmail.isEmpty()) {
                this.usernameOrEmail = username;
            }
        }

        @JsonProperty("email")
        public void setEmail(String email) {
            if (this.usernameOrEmail == null || this.usernameOrEmail.isEmpty()) {
                this.usernameOrEmail = email;
            }
        }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class UserDto {
        private Integer id;
        private String username;
        private String email;
        @JsonProperty("full_name")
        private String fullName;
        @JsonProperty("avatar_url")
        private String avatarUrl;
        private String bio;
        private String location;
        @JsonProperty("is_seller")
        private boolean isSeller;
        @JsonProperty("is_admin")
        private boolean isAdmin;
        @JsonProperty("created_at")
        private OffsetDateTime createdAt;

        public UserDto() {}

        public static UserDto from(User user) {
            if (user == null) return null;
            UserDto dto = new UserDto();
            dto.setId(user.getId());
            dto.setUsername(user.getUsername());
            dto.setEmail(user.getEmail());
            dto.setFullName(user.getFullName());
            dto.setAvatarUrl(user.getAvatarUrl());
            dto.setBio(user.getBio());
            dto.setLocation(user.getLocation());
            dto.setSeller(user.isSeller());
            dto.setAdmin(user.isAdmin());
            dto.setCreatedAt(user.getCreatedAt());
            return dto;
        }

        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getAvatarUrl() { return avatarUrl; }
        public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

        public String getBio() { return bio; }
        public void setBio(String bio) { this.bio = bio; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public boolean isSeller() { return isSeller; }
        public void setSeller(boolean seller) { isSeller = seller; }

        public boolean isAdmin() { return isAdmin; }
        public void setAdmin(boolean admin) { isAdmin = admin; }

        public OffsetDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    }

    public static class AuthResponse {
        private String message;
        private UserDto user;

        public AuthResponse() {}
        public AuthResponse(String message, UserDto user) {
            this.message = message;
            this.user = user;
        }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public UserDto getUser() { return user; }
        public void setUser(UserDto user) { this.user = user; }
    }

    public static class MeResponse {
        private boolean authenticated;
        private UserDto user;

        public MeResponse() {}
        public MeResponse(boolean authenticated, UserDto user) {
            this.authenticated = authenticated;
            this.user = user;
        }

        public boolean isAuthenticated() { return authenticated; }
        public void setAuthenticated(boolean authenticated) { this.authenticated = authenticated; }

        public UserDto getUser() { return user; }
        public void setUser(UserDto user) { this.user = user; }
    }
}
