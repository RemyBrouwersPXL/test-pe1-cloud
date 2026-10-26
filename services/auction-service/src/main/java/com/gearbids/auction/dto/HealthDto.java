package com.gearbids.auction.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class HealthDto {
    private String status;
    private String service;
    private String version;
    @JsonProperty("release_tag")
    private String releaseTag;
    @JsonProperty("git_commit")
    private String gitCommit;
    private String timestamp;
    @JsonProperty("uptime_seconds")
    private long uptimeSeconds;

    public HealthDto() {}

    public HealthDto(String status, String service, String timestamp, long uptimeSeconds) {
        this(status, service, "1.0.0", "v1.0.0", "unknown", timestamp, uptimeSeconds);
    }

    public HealthDto(String status, String service, String version, String releaseTag, String gitCommit, String timestamp, long uptimeSeconds) {
        this.status = status;
        this.service = service;
        this.version = version;
        this.releaseTag = releaseTag;
        this.gitCommit = gitCommit;
        this.timestamp = timestamp;
        this.uptimeSeconds = uptimeSeconds;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getService() { return service; }
    public void setService(String service) { this.service = service; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getReleaseTag() { return releaseTag; }
    public void setReleaseTag(String releaseTag) { this.releaseTag = releaseTag; }

    public String getGitCommit() { return gitCommit; }
    public void setGitCommit(String gitCommit) { this.gitCommit = gitCommit; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public long getUptimeSeconds() { return uptimeSeconds; }
    public void setUptimeSeconds(long uptimeSeconds) { this.uptimeSeconds = uptimeSeconds; }
}
