package com.ykscoach.api.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

record RegisterRequest(String username, String password, String fullName, String email, String phone, String role) {}
record LoginRequest(String username, String password) {}
record AuthResponse(String token) {}
record ProfileResponse(String username, String role, String fullName, String email, String phone, String bio) {}
record ProfileUpdateRequest(String fullName, String email, String phone, String bio) {}

@RestController
@RequestMapping("/auth")
@CrossOrigin
public class AuthController {
    private final UserRepository users;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final JwtUtil jwt;

    public AuthController(UserRepository users, JwtUtil jwt) {
        this.users = users;
        this.jwt = jwt;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (req.username() == null || req.password() == null) return ResponseEntity.badRequest().build();
        if (users.findByUsername(req.username()).isPresent()) return ResponseEntity.status(409).body("exists");
        User u = new User();
        u.setUsername(req.username());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setFullName(req.fullName());
        u.setEmail(req.email());
        u.setPhone(req.phone());
        if (req.role() != null && !req.role().isBlank()) {
            u.setRole(req.role());
        }
        users.save(u);
        String token = jwt.generateToken(u.getUsername(), u.getRole());
        return ResponseEntity.ok(new AuthResponse(token));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        return users.findByUsername(req.username())
            .filter(u -> encoder.matches(req.password(), u.getPasswordHash()))
            .<ResponseEntity<?>>map(u -> ResponseEntity.ok(new AuthResponse(jwt.generateToken(u.getUsername(), u.getRole()))))
            .orElseGet(() -> ResponseEntity.status(401).build());
    }

    // TEMP: simple listing to verify persistence during development
    @GetMapping("/users")
    public java.util.List<User> listUsers() {
        return users.findAll();
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(java.security.Principal principal) {
        return users.findByUsername(principal.getName())
            .<ResponseEntity<?>>map(u -> ResponseEntity.ok(new ProfileResponse(u.getUsername(), u.getRole(), u.getFullName(), u.getEmail(), u.getPhone(), u.getBio())))
            .orElse(ResponseEntity.status(404).build());
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMe(java.security.Principal principal, @RequestBody ProfileUpdateRequest req) {
        return users.findByUsername(principal.getName())
            .map(u -> {
                u.setFullName(req.fullName());
                u.setEmail(req.email());
                u.setPhone(req.phone());
                u.setBio(req.bio());
                users.save(u);
                return ResponseEntity.ok(new ProfileResponse(u.getUsername(), u.getRole(), u.getFullName(), u.getEmail(), u.getPhone(), u.getBio()));
            })
            .orElse(ResponseEntity.status(404).build());
    }
}


