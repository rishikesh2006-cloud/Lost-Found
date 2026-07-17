package com.lostandfound.backend.controller;

import com.lostandfound.backend.dto.ClaimRequest;
import com.lostandfound.backend.model.Claim;
import com.lostandfound.backend.model.Item;
import com.lostandfound.backend.model.Notification;
import com.lostandfound.backend.model.User;
import com.lostandfound.backend.repository.ClaimRepository;
import com.lostandfound.backend.repository.ItemRepository;
import com.lostandfound.backend.repository.NotificationRepository;
import com.lostandfound.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/claims")
@CrossOrigin
public class ClaimController {

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    // Submit a claim
    @PostMapping
    public ResponseEntity<?> submitClaim(@RequestBody ClaimRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        if (currentUser == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "User not found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        Item item = itemRepository.findById(request.getItemId()).orElse(null);
        if (item == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Item not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        if (item.getUser().getId().equals(currentUser.getId())) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "You cannot claim your own item");
            return ResponseEntity.badRequest().body(response);
        }

        Claim claim = new Claim(item, currentUser, request.getDescription(), "PENDING");
        claim = claimRepository.save(claim);

        // Notify item owner
        String alertMsg = "New claim request submitted by user '" + currentUser.getUsername() + "' for your item: " + item.getTitle();
        Notification notification = new Notification(item.getUser(), alertMsg);
        notificationRepository.save(notification);

        return ResponseEntity.ok(claim);
    }

    // List claims contextually
    @GetMapping
    public ResponseEntity<?> getClaims() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        if (currentUser == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "User not found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        List<Claim> claims;
        if (currentUser.getRole().equals("ADMIN")) {
            // Admin sees all claims
            claims = claimRepository.findAllByOrderByCreatedAtDesc();
        } else {
            // Regular user sees:
            // 1. Claims they submitted
            // 2. Claims on items they posted
            List<Claim> myClaims = claimRepository.findByUser_IdOrderByCreatedAtDesc(currentUser.getId());
            List<Claim> claimsOnMyItems = claimRepository.findByItem_User_IdOrderByCreatedAtDesc(currentUser.getId());
            
            // Combine both lists
            myClaims.addAll(claimsOnMyItems);
            claims = myClaims;
        }

        return ResponseEntity.ok(claims);
    }

    // Approve/Reject claim (requires owner of item or admin)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateClaimStatus(
            @PathVariable Long id,
            @RequestParam("status") String status) {

        if (!status.equalsIgnoreCase("APPROVED") && !status.equalsIgnoreCase("REJECTED")) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Invalid status value");
            return ResponseEntity.badRequest().body(response);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        if (currentUser == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "User not found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        Claim claim = claimRepository.findById(id).orElse(null);
        if (claim == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Claim not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        Item item = claim.getItem();

        // Check permission: Must be owner of item OR admin
        if (!currentUser.getRole().equals("ADMIN") && !item.getUser().getId().equals(currentUser.getId())) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Unauthorized to update this claim status");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        claim.setStatus(status.toUpperCase());
        claim = claimRepository.save(claim);

        // Update item status if approved
        if (status.equalsIgnoreCase("APPROVED")) {
            item.setStatus("CLAIMED");
            itemRepository.save(item);
        }

        // Notify claimant
        String alertMsg = "Your claim request for item '" + item.getTitle() + "' has been " + status.toUpperCase();
        Notification notification = new Notification(claim.getUser(), alertMsg);
        notificationRepository.save(notification);

        return ResponseEntity.ok(claim);
    }
}
