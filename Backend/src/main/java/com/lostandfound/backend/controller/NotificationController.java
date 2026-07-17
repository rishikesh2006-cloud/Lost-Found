package com.lostandfound.backend.controller;

import com.lostandfound.backend.model.Notification;
import com.lostandfound.backend.model.User;
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
@RequestMapping("/api/notifications")
@CrossOrigin
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getNotifications() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        if (currentUser == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "User not found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        List<Notification> list = notificationRepository.findByUser_IdOrderByCreatedAtDesc(currentUser.getId());
        long unreadCount = notificationRepository.countByUser_IdAndIsReadFalse(currentUser.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("unreadCount", unreadCount);
        response.put("data", list);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        if (currentUser == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "User not found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        Notification notification = notificationRepository.findById(id).orElse(null);
        if (notification == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Notification not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        if (!notification.getUser().getId().equals(currentUser.getId())) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Unauthorized action");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        notification.setRead(true);
        notificationRepository.save(notification);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Notification marked as read");
        return ResponseEntity.ok(response);
    }
}
