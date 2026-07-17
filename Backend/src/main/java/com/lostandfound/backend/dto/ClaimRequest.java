package com.lostandfound.backend.dto;

public class ClaimRequest {
    private Long itemId;
    private String description; // Proof of ownership details

    public ClaimRequest() {}

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
