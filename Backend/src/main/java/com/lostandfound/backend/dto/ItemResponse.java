package com.lostandfound.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ItemResponse {
    private Long id;
    private String title;
    private String description;
    private String type;
    private String category;
    private String status;
    private List<String> images;
    private String founderName;
    private Long founderId;
    private LocalDateTime createdAt;
    private String email; // Hiddable
    private String phoneno; // Hiddable

    public ItemResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }

    public String getFounderName() { return founderName; }
    public void setFounderName(String founderName) { this.founderName = founderName; }

    public Long getFounderId() { return founderId; }
    public void setFounderId(Long founderId) { this.founderId = founderId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneno() { return phoneno; }
    public void setPhoneno(String phoneno) { this.phoneno = phoneno; }
}
