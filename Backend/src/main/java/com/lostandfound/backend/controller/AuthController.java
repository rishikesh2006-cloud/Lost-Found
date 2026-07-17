package com.lostandfound.backend.controller;

import com.lostandfound.backend.dto.JwtResponse;
import com.lostandfound.backend.dto.LoginRequest;
import com.lostandfound.backend.dto.RegisterRequest;
import com.lostandfound.backend.model.User;
import com.lostandfound.backend.repository.UserRepository;
import com.lostandfound.backend.security.JwtTokenUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Username is already taken");
            return ResponseEntity.badRequest().body(response);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Email is already registered");
            return ResponseEntity.badRequest().body(response);
        }

        String password = request.getPassword();
        if (password == null || password.length() < 5) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password must be at least 5 characters long");
            return ResponseEntity.badRequest().body(response);
        }
        boolean hasDigit = false;
        boolean hasSpecial = false;
        for (char c : password.toCharArray()) {
            if (Character.isDigit(c)) {
                hasDigit = true;
            } else if (!Character.isLetterOrDigit(c)) {
                hasSpecial = true;
            }
        }
        if (!hasDigit) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password must contain at least one number");
            return ResponseEntity.badRequest().body(response);
        }
        if (!hasSpecial) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password must contain at least one special character");
            return ResponseEntity.badRequest().body(response);
        }

        String role = "USER";
        if (request.getRole() != null && (request.getRole().equalsIgnoreCase("ADMIN") || request.getRole().equalsIgnoreCase("USER"))) {
            role = request.getRole().toUpperCase();
        }

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                request.getPhone(),
                passwordEncoder.encode(request.getPassword()),
                role
        );

        userRepository.save(user);
        Map<String, String> response = new HashMap<>();
        response.put("message", "User registered successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Invalid username or password");
            return ResponseEntity.badRequest().body(response);
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
        
        final String token = jwtTokenUtil.generateToken(userDetails, user.getRole(), user.getId());

        return ResponseEntity.ok(new JwtResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getRole()
        ));
    }
}
