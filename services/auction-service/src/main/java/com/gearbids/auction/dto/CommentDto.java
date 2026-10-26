package com.gearbids.auction.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.gearbids.auction.model.Comment;
import jakarta.validation.constraints.NotBlank;

public class CommentDto {

    public static class PostCommentRequest {
        @NotBlank(message = "Comment content cannot be empty")
        private String content;

        @JsonProperty("parent_comment_id")
        private Integer parentCommentId;

        public PostCommentRequest() {}

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }

        public Integer getParentCommentId() { return parentCommentId; }
        public void setParentCommentId(Integer parentCommentId) { this.parentCommentId = parentCommentId; }
    }

    public static class CommentResponse {
        private String message;
        private Comment comment;

        public CommentResponse() {}
        public CommentResponse(String message, Comment comment) {
            this.message = message;
            this.comment = comment;
        }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public Comment getComment() { return comment; }
        public void setComment(Comment comment) { this.comment = comment; }
    }
}
