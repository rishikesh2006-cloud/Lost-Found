package com.lostandfound.backend.controller;

import com.lostandfound.backend.model.Message;
import com.lostandfound.backend.model.User;
import com.lostandfound.backend.repository.MessageRepository;
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
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin
public class ChatController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    // Get message history between current user and another user
    @GetMapping("/history/{otherUserId}")
    public ResponseEntity<?> getChatHistory(@PathVariable Long otherUserId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        if (currentUser == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "User not found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        User otherUser = userRepository.findById(otherUserId).orElse(null);
        if (otherUser == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Target user not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        List<Message> history = messageRepository.findChatHistory(currentUser.getId(), otherUserId);
        
        // Map to custom representation to avoid serializing complete sender/receiver details (except id/username)
        List<Map<String, Object>> formattedMessages = history.stream().map(msg -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", msg.getId());
            map.put("senderId", msg.getSender().getId());
            map.put("senderName", msg.getSender().getUsername());
            map.put("receiverId", msg.getReceiver().getId());
            map.put("receiverName", msg.getReceiver().getUsername());
            map.put("message", msg.getMessage());
            map.put("createdAt", msg.getCreatedAt());
            if (msg.getItem() != null) {
                map.put("itemId", msg.getItem().getId());
                map.put("itemTitle", msg.getItem().getTitle());
            }
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(formattedMessages);
    }

    // List all users the current user has active conversations with
    @GetMapping("/list")
    public ResponseEntity<?> getChatList() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);

        if (currentUser == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "User not found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        List<User> partners = messageRepository.findActiveChatPartners(currentUser.getId());
        
        List<Map<String, Object>> formattedPartners = partners.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("role", u.getRole());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(formattedPartners);
    }
}
