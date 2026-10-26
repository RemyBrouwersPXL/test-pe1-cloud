package com.gearbids.auction.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public class Comment {
    private Integer id;
    @JsonProperty("auction_id")
    private Integer auctionId;
    @JsonProperty("user_id")
    private Integer userId;
    @JsonProperty("parent_comment_id")
    private Integer parentCommentId;
    private String content;
    @JsonProperty("is_seller_comment")
    private boolean isSellerComment;
    @JsonProperty("created_at")
    private OffsetDateTime createdAt;

    // Joined user info
    @JsonProperty("author_name")
    private String authorName;
    @JsonProperty("author_username")
    private String authorUsername;
    @JsonProperty("author_avatar")
    private String authorAvatar;

    // Nested replies
    private List<Comment> replies = new ArrayList<>();

    public Comment() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getAuctionId() { return auctionId; }
    public void setAuctionId(Integer auctionId) { this.auctionId = auctionId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getParentCommentId() { return parentCommentId; }
    public void setParentCommentId(Integer parentCommentId) { this.parentCommentId = parentCommentId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public boolean isSellerComment() { return isSellerComment; }
    public void setSellerComment(boolean sellerComment) { isSellerComment = sellerComment; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getAuthorUsername() { return authorUsername; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }

    public String getAuthorAvatar() { return authorAvatar; }
    public void setAuthorAvatar(String authorAvatar) { this.authorAvatar = authorAvatar; }

    public List<Comment> getReplies() { return replies; }
    public void setReplies(List<Comment> replies) { this.replies = replies != null ? replies : new ArrayList<>(); }
}
