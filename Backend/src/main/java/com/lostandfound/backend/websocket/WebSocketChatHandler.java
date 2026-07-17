package com.lostandfound.backend.websocket;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.lostandfound.backend.model.Item;
import com.lostandfound.backend.model.Message;
import com.lostandfound.backend.model.User;
import com.lostandfound.backend.repository.ItemRepository;
import com.lostandfound.backend.repository.MessageRepository;
import com.lostandfound.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketChatHandler extends TextWebSocketHandler {

    // Map to keep track of active sessions by username
    private final Map<String, WebSocketSession> activeSessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ItemRepository itemRepository;

    public WebSocketChatHandler() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Principal principal = session.getPrincipal();
        if (principal != null) {
            String username = principal.getName();
            activeSessions.put(username, session);
            System.out.println("WebSocket Connection established by: " + username);
        } else {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("User not authenticated"));
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Principal principal = session.getPrincipal();
        if (principal == null) return;

        String senderName = principal.getName();
        String payload = message.getPayload();

        try {
            // Expected payload: { "receiverId": 123, "message": "hello", "itemId": 456 }
            Map<String, Object> incoming = objectMapper.readValue(payload, Map.class);
            
            String msgText = (String) incoming.get("message");
            Number receiverIdNum = (Number) incoming.get("receiverId");
            Number itemIdNum = (Number) incoming.get("itemId");

            if (msgText == null || receiverIdNum == null) {
                sendErrorMessage(session, "Missing message content or receiverId");
                return;
            }

            Long receiverId = receiverIdNum.longValue();
            Long itemId = (itemIdNum != null) ? itemIdNum.longValue() : null;

            User sender = userRepository.findByUsername(senderName).orElse(null);
            User receiver = userRepository.findById(receiverId).orElse(null);

            if (sender == null || receiver == null) {
                sendErrorMessage(session, "Sender or Receiver not found in database");
                return;
            }

            Item item = null;
            if (itemId != null) {
                item = itemRepository.findById(itemId).orElse(null);
            }

            // Persist the message in the DB
            Message chatMessage = new Message(sender, receiver, item, msgText);
            chatMessage = messageRepository.save(chatMessage);

            // Construct payload to forward
            Map<String, Object> outgoing = new HashMap<>();
            outgoing.put("id", chatMessage.getId());
            outgoing.put("senderId", sender.getId());
            outgoing.put("senderName", sender.getUsername());
            outgoing.put("receiverId", receiver.getId());
            outgoing.put("receiverName", receiver.getUsername());
            outgoing.put("message", chatMessage.getMessage());
            outgoing.put("createdAt", chatMessage.getCreatedAt().toString());
            if (item != null) {
                outgoing.put("itemId", item.getId());
                outgoing.put("itemTitle", item.getTitle());
            }

            String outgoingJson = objectMapper.writeValueAsString(outgoing);
            TextMessage textMsg = new TextMessage(outgoingJson);

            // Send to receiver if online
            WebSocketSession receiverSession = activeSessions.get(receiver.getUsername());
            if (receiverSession != null && receiverSession.isOpen()) {
                receiverSession.sendMessage(textMsg);
            }

            // Send back to sender to confirm delivery
            if (session.isOpen()) {
                session.sendMessage(textMsg);
            }

        } catch (Exception e) {
            e.printStackTrace();
            sendErrorMessage(session, "Error processing chat message: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Principal principal = session.getPrincipal();
        if (principal != null) {
            String username = principal.getName();
            activeSessions.remove(username);
            System.out.println("WebSocket Connection closed by: " + username);
        }
    }

    private void sendErrorMessage(WebSocketSession session, String errorMsg) {
        try {
            if (session.isOpen()) {
                Map<String, String> err = new HashMap<>();
                err.put("error", errorMsg);
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(err)));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
