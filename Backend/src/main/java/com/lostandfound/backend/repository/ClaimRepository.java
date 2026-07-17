package com.lostandfound.backend.repository;

import com.lostandfound.backend.model.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findByUser_IdOrderByCreatedAtDesc(Long userId);
    List<Claim> findByItem_User_IdOrderByCreatedAtDesc(Long ownerId);
    List<Claim> findAllByOrderByCreatedAtDesc();
}
