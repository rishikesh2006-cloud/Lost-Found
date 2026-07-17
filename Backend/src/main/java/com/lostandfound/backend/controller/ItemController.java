package com.lostandfound.backend.controller;

import com.lostandfound.backend.dto.ItemResponse;
import com.lostandfound.backend.model.Item;
import com.lostandfound.backend.model.ItemImage;
import com.lostandfound.backend.model.User;
import com.lostandfound.backend.repository.ItemImageRepository;
import com.lostandfound.backend.repository.ItemRepository;
import com.lostandfound.backend.repository.UserRepository;
import com.lostandfound.backend.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/items")
@CrossOrigin
public class ItemController {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ItemImageRepository itemImageRepository;

    @Autowired
    private FileStorageService fileStorageService;

    // Get all items with optional search & filters
    @GetMapping
    public ResponseEntity<?> getItems(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "status", required = false) String status) {

        // If parameters are empty strings, treat them as null for SQL query
        String q = (query != null && !query.trim().isEmpty()) ? query : null;
        String t = (type != null && !type.trim().isEmpty()) ? type : null;
        String c = (category != null && !category.trim().isEmpty()) ? category : null;
        String s = (status != null && !status.trim().isEmpty()) ? status : null;

        List<Item> items = itemRepository.searchItems(q, t, c, s);
        
        List<ItemResponse> responseData = items.stream()
                .map(this::convertToResponsePublic)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("count", responseData.size());
        response.put("data", responseData);
        return ResponseEntity.ok(response);
    }

    // Get single item by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getItemById(@PathVariable Long id) {
        Item item = itemRepository.findById(id).orElse(null);
        if (item == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Item not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        ItemResponse responseDto = convertToResponsePublic(item);

        // Disclose phone and email ONLY if the caller is the owner or an ADMIN
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean canViewContact = false;
        if (authentication != null && authentication.isAuthenticated() && !(authentication instanceof AnonymousAuthenticationToken)) {
            String currentUsername = authentication.getName();
            User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
            if (currentUser != null && (currentUser.getRole().equals("ADMIN") || item.getUser().getId().equals(currentUser.getId()))) {
                canViewContact = true;
            }
        }

        if (canViewContact) {
            responseDto.setEmail(item.getUser().getEmail());
            responseDto.setPhoneno(item.getUser().getPhone());
        } else {
            responseDto.setEmail(null);
            responseDto.setPhoneno(null);
        }

        return ResponseEntity.ok(responseDto);
    }

    // Post an Item (requires auth)
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> createItem(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("type") String type,
            @RequestParam("category") String category,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        if (currentUser == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Authenticated user not found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        Item item = new Item(title, description, type, category, status, currentUser);
        item = itemRepository.save(item);

        List<ItemImage> itemImages = new ArrayList<>();

        // Handle multiple files
        if (files != null && files.length > 0) {
            for (MultipartFile f : files) {
                try {
                    String filename = fileStorageService.storeFile(f);
                    if (filename != null) {
                        itemImages.add(new ItemImage(item, filename));
                    }
                } catch (IOException e) {
                    // Log upload error
                }
            }
        }

        // Handle single file (for backward compatibility)
        if (file != null && !file.isEmpty()) {
            try {
                String filename = fileStorageService.storeFile(file);
                if (filename != null) {
                    itemImages.add(new ItemImage(item, filename));
                }
            } catch (IOException e) {
                // Log upload error
            }
        }

        if (!itemImages.isEmpty()) {
            itemImageRepository.saveAll(itemImages);
            item.setImages(itemImages);
        }

        return ResponseEntity.ok(convertToResponsePublic(item));
    }

    // Delete an Item (requires owner or admin auth)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteItem(@PathVariable Long id) {
        Item item = itemRepository.findById(id).orElse(null);
        if (item == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Item not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        if (currentUser == null || (!currentUser.getRole().equals("ADMIN") && !item.getUser().getId().equals(currentUser.getId()))) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Unauthorized to delete this item");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        itemRepository.delete(item);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Item deleted successfully");
        return ResponseEntity.ok(response);
    }

    // Map Item to ItemResponse DTO (stripping email/phone by default)
    private ItemResponse convertToResponsePublic(Item item) {
        ItemResponse dto = new ItemResponse();
        dto.setId(item.getId());
        dto.setTitle(item.getTitle());
        dto.setDescription(item.getDescription());
        dto.setType(item.getType());
        dto.setCategory(item.getCategory());
        dto.setStatus(item.getStatus());
        dto.setFounderName(item.getUser().getUsername());
        dto.setFounderId(item.getUser().getId());
        dto.setCreatedAt(item.getCreatedAt());
        
        List<String> imagePaths = item.getImages().stream()
                .map(ItemImage::getImagePath)
                .collect(Collectors.toList());
        dto.setImages(imagePaths);
        return dto;
    }
}
