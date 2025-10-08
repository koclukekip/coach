package com.ykscoach.api.chat;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

record ConversationRequest(String coachUsername) {}

@RestController
@RequestMapping("/api/conversations")
@CrossOrigin
public class ConversationController {
    private final ConversationRepository conversations;
    private final MessageRepository messages;
    private final com.ykscoach.api.coach.CoachAssignmentRepository assignments;

    public ConversationController(ConversationRepository conversations, MessageRepository messages, com.ykscoach.api.coach.CoachAssignmentRepository assignments) {
        this.conversations = conversations;
        this.messages = messages;
        this.assignments = assignments;
    }

    @PostMapping("/request")
    public ResponseEntity<?> request(Principal principal, @RequestBody ConversationRequest req) {
        Conversation c = new Conversation();
        c.setStudentUsername(principal.getName());
        c.setCoachUsername(req.coachUsername());
        conversations.save(c);
        return ResponseEntity.ok(c);
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<?> accept(Principal principal, @PathVariable Long id) {
        return conversations.findByIdAndCoachUsername(id, principal.getName())
            .map(c -> {
                // enforce one coach per student
                var existing = assignments.findByStudentUsername(c.getStudentUsername());
                if (existing.isEmpty()) {
                    var a = new com.ykscoach.api.coach.CoachAssignment();
                    a.setStudentUsername(c.getStudentUsername());
                    a.setCoachUsername(c.getCoachUsername());
                    assignments.save(a);
                }
                c.setStatus(Conversation.Status.ACCEPTED);
                conversations.save(c);
                return ResponseEntity.ok(c);
            })
            .orElse(ResponseEntity.status(404).build());
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markRead(Principal principal, @PathVariable Long id, @RequestParam String role) {
        return conversations.findById(id).map(c -> {
            String name = principal.getName();
            if (!name.equals(c.getCoachUsername()) && !name.equals(c.getStudentUsername())) {
                return ResponseEntity.status(403).build();
            }
            java.time.Instant now = java.time.Instant.now();
            if ("coach".equals(role)) c.setCoachLastReadAt(now); else c.setStudentLastReadAt(now);
            conversations.save(c);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.status(404).build());
    }

    @GetMapping("/mine")
    public List<Conversation> mine(Principal principal, @RequestParam String role) {
        String name = principal != null ? principal.getName() : null;
        if (name == null || name.isBlank()) return List.of();
        return switch (role) {
            case "coach" -> conversations.findByCoachUsername(name);
            case "student" -> conversations.findByStudentUsername(name);
            default -> List.of();
        };
    }

    public static record MessageDto(Long id, String from, String text, java.time.Instant createdAt) {}

    @GetMapping("/{id}/messages")
    public ResponseEntity<?> history(Principal principal, @PathVariable Long id) {
        return conversations.findById(id).map(c -> {
            String name = principal.getName();
            if (!name.equals(c.getCoachUsername()) && !name.equals(c.getStudentUsername())) {
                return ResponseEntity.status(403).build();
            }
            var list = messages.findByConversationIdOrderByCreatedAtAsc(id).stream()
                    .map(m -> new MessageDto(m.getId(), m.getFromUsername(), m.getText(), m.getCreatedAt()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(list);
        }).orElse(ResponseEntity.status(404).build());
    }
}


