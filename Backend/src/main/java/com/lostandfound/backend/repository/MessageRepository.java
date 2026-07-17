package com.lostandfound.backend.repository;

import com.lostandfound.backend.model.Message;
import com.lostandfound.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender.id = :user1 AND m.receiver.id = :user2) OR " +
           "(m.sender.id = :user2 AND m.receiver.id = :user1) " +
           "ORDER BY m.createdAt ASC")
    List<Message> findChatHistory(@Param("user1") Long user1, @Param("user2") Long user2);

    @Query("SELECT DISTINCT u FROM User u WHERE u.id != :userId AND " +
           "(u.id IN (SELECT DISTINCT m.receiver.id FROM Message m WHERE m.sender.id = :userId) OR " +
           " u.id IN (SELECT DISTINCT m.sender.id FROM Message m WHERE m.receiver.id = :userId))")
    List<User> findActiveChatPartners(@Param("userId") Long userId);
}
