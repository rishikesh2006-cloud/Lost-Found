package com.lostandfound.backend.controller;

import com.lostandfound.backend.model.Claim;
import com.lostandfound.backend.model.Item;
import com.lostandfound.backend.model.User;
import com.lostandfound.backend.repository.ClaimRepository;
import com.lostandfound.backend.repository.ItemRepository;
import com.lostandfound.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private ClaimRepository claimRepository;

    // Get Admin Dashboard Stats
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long totalUsers = userRepository.count();
        List<Item> allItems = itemRepository.findAll();
        
        long lostCount = allItems.stream().filter(i -> i.getType().equalsIgnoreCase("LOST")).count();
        long foundCount = allItems.stream().filter(i -> i.getType().equalsIgnoreCase("FOUND")).count();
        long claimedCount = allItems.stream().filter(i -> i.getStatus().equalsIgnoreCase("CLAIMED") || i.getStatus().equalsIgnoreCase("RETURNED")).count();

        List<Claim> allClaims = claimRepository.findAll();
        long pendingClaims = allClaims.stream().filter(c -> c.getStatus().equalsIgnoreCase("PENDING")).count();
        long approvedClaims = allClaims.stream().filter(c -> c.getStatus().equalsIgnoreCase("APPROVED")).count();
        long rejectedClaims = allClaims.stream().filter(c -> c.getStatus().equalsIgnoreCase("REJECTED")).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalItems", allItems.size());
        stats.put("lostItems", lostCount);
        stats.put("foundItems", foundCount);
        stats.put("claimedItems", claimedCount);
        stats.put("totalClaims", allClaims.size());
        stats.put("pendingClaims", pendingClaims);
        stats.put("approvedClaims", approvedClaims);
        stats.put("rejectedClaims", rejectedClaims);

        return ResponseEntity.ok(stats);
    }

    // List all users
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepository.findAll();
        
        // Exclude passwords
        List<Map<String, Object>> sanitizedUsers = users.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("email", u.getEmail());
            map.put("phone", u.getPhone());
            map.put("role", u.getRole());
            map.put("createdAt", u.getCreatedAt());
            return map;
        }).toList();

        return ResponseEntity.ok(sanitizedUsers);
    }

    // Delete a user
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "User not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        if (user.getRole().equals("ADMIN")) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Cannot delete an Admin user");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        userRepository.delete(user);
        Map<String, String> response = new HashMap<>();
        response.put("message", "User deleted successfully");
        return ResponseEntity.ok(response);
    }

    // Verify / moderate item status
    @PutMapping("/items/{id}/verify")
    public ResponseEntity<?> verifyItem(
            @PathVariable Long id,
            @RequestParam("status") String status) {

        Item item = itemRepository.findById(id).orElse(null);
        if (item == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Item not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        item.setStatus(status.toUpperCase());
        itemRepository.save(item);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Item status updated to " + status.toUpperCase());
        return ResponseEntity.ok(response);
    }
}
