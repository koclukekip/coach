package com.ykscoach.api.coach;

import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/coach-assignments")
@CrossOrigin
public class CoachAssignmentController {
    private final CoachAssignmentRepository assignments;
    private final com.ykscoach.api.chat.ConversationRepository conversations;

    public CoachAssignmentController(CoachAssignmentRepository assignments, com.ykscoach.api.chat.ConversationRepository conversations) {
        this.assignments = assignments;
        this.conversations = conversations;
    }

    @GetMapping("/my-students")
    public List<CoachAssignment> myStudents(Principal principal) {
        String name = principal != null ? principal.getName() : null;
        if (name == null || name.isBlank()) return List.of();
        return assignments.findByCoachUsername(name);
    }

    public record AssignRequest(String studentUsername) {}

    @PostMapping("/assign")
    public ResponseEntity<?> assign(Principal principal, @RequestBody AssignRequest req) {
        String coach = principal != null ? principal.getName() : null;
        if (coach == null || coach.isBlank()) return ResponseEntity.status(401).build();
        if (req == null || req.studentUsername() == null || req.studentUsername().isBlank()) return ResponseEntity.badRequest().build();
        var existing = assignments.findByStudentUsername(req.studentUsername());
        if (existing.isPresent()) {
            return ResponseEntity.status(409).body("Student already assigned to a coach");
        }
        var a = new CoachAssignment();
        a.setStudentUsername(req.studentUsername());
        a.setCoachUsername(coach);
        assignments.save(a);
        // ensure conversation exists and accepted
        var conv = conversations.findByCoachUsernameAndStudentUsername(coach, req.studentUsername())
            .orElseGet(() -> {
                var c = new com.ykscoach.api.chat.Conversation();
                c.setCoachUsername(coach);
                c.setStudentUsername(req.studentUsername());
                return conversations.save(c);
            });
        conv.setStatus(com.ykscoach.api.chat.Conversation.Status.ACCEPTED);
        conversations.save(conv);
        return ResponseEntity.ok(a);
    }
}


