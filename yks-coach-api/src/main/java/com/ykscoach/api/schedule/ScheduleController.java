package com.ykscoach.api.schedule;

import com.ykscoach.api.chat.Conversation;
import com.ykscoach.api.chat.ConversationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.util.List;

record CreateSlotRequest(String start, String end, String title) {}
record CoachSlotDto(Long id, Long conversationId, String studentUsername, String start, String end, String status, String title) {}

@RestController
@RequestMapping("/api/schedule")
@CrossOrigin
public class ScheduleController {
    private final ScheduleSlotRepository slots;
    private final ConversationRepository conversations;

    public ScheduleController(ScheduleSlotRepository slots, ConversationRepository conversations) {
        this.slots = slots;
        this.conversations = conversations;
    }

    @GetMapping("/coach")
    public java.util.List<CoachSlotDto> allForCoach(Principal principal) {
        String name = principal != null ? principal.getName() : null;
        if (name == null) return java.util.List.of();
        return slots.findAllForCoach(name).stream().map(s -> {
            var conv = conversations.findById(s.getConversationId()).orElse(null);
            String student = conv != null ? conv.getStudentUsername() : "";
            return new CoachSlotDto(s.getId(), s.getConversationId(), student, s.getStart().toString(), s.getEnd().toString(), s.getStatus().name(), s.getTitle());
        }).toList();
    }

    @GetMapping("/conversations/{conversationId}/slots")
    public ResponseEntity<?> list(Principal principal, @PathVariable Long conversationId) {
        return conversations.findById(conversationId).map(c -> {
            if (!isParticipant(principal, c)) return ResponseEntity.status(403).build();
            List<ScheduleSlot> list = slots.findByConversationIdOrderByStartAsc(conversationId);
            return ResponseEntity.ok(list);
        }).orElse(ResponseEntity.status(404).build());
    }

    // Public coach availability across all students (only OPEN)
    @GetMapping("/coach/{coachUsername}/open")
    public List<ScheduleSlot> openForCoach(@PathVariable String coachUsername) {
        return slots.findAllForCoach(coachUsername).stream()
                .filter(s -> s.getStatus() == ScheduleSlot.Status.OPEN)
                .toList();
    }

    @PostMapping("/conversations/{conversationId}/slots")
    public ResponseEntity<?> create(Principal principal, @PathVariable Long conversationId, @RequestBody CreateSlotRequest req) {
        return conversations.findById(conversationId).map(c -> {
            if (!principal.getName().equals(c.getCoachUsername())) return ResponseEntity.status(403).build();
            ScheduleSlot sl = new ScheduleSlot();
            sl.setConversationId(conversationId);
            sl.setStart(Instant.parse(req.start()));
            sl.setEnd(Instant.parse(req.end()));
            sl.setStatus(ScheduleSlot.Status.OPEN);
            sl.setTitle(req.title());
            return ResponseEntity.ok(slots.save(sl));
        }).orElse(ResponseEntity.status(404).build());
    }

    // Student requests a new slot for a conversation
    @PostMapping("/conversations/{conversationId}/request")
    public ResponseEntity<?> requestSlot(Principal principal, @PathVariable Long conversationId, @RequestBody CreateSlotRequest req) {
        return conversations.findById(conversationId).map(c -> {
            if (!principal.getName().equals(c.getStudentUsername())) return ResponseEntity.status(403).build();
            ScheduleSlot sl = new ScheduleSlot();
            sl.setConversationId(conversationId);
            sl.setStart(Instant.parse(req.start()));
            sl.setEnd(Instant.parse(req.end()));
            sl.setStatus(ScheduleSlot.Status.REQUESTED);
            sl.setTitle(req.title());
            return ResponseEntity.ok(slots.save(sl));
        }).orElse(ResponseEntity.status(404).build());
    }

    @PostMapping("/coach/slots")
    public ResponseEntity<?> createForCoach(Principal principal, @RequestParam String studentUsername, @RequestBody CreateSlotRequest req) {
        try {
            String coach = principal != null ? principal.getName() : null;
            if (coach == null) return ResponseEntity.status(401).build();
            var conv = conversations.findByCoachUsernameAndStudentUsername(coach, studentUsername)
                    .orElseGet(() -> {
                        var c = new Conversation();
                        c.setCoachUsername(coach);
                        c.setStudentUsername(studentUsername);
                        c.setStatus(Conversation.Status.ACCEPTED);
                        return conversations.save(c);
                    });
            if (conv.getStatus() != Conversation.Status.ACCEPTED) {
                conv.setStatus(Conversation.Status.ACCEPTED);
                conversations.save(conv);
            }
            ScheduleSlot sl = new ScheduleSlot();
            sl.setConversationId(conv.getId());
            sl.setStart(Instant.parse(req.start()));
            sl.setEnd(Instant.parse(req.end()));
            // coach-created meetings are immediately booked/reserved
            sl.setStatus(ScheduleSlot.Status.BOOKED);
            sl.setTitle(req.title());
            return ResponseEntity.ok(slots.save(sl));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("error: " + e.getClass().getSimpleName());
        }
    }

    @PostMapping("/slots/{slotId}/book")
    public ResponseEntity<?> book(Principal principal, @PathVariable Long slotId) {
        return slots.findById(slotId).map(sl -> conversations.findById(sl.getConversationId()).map(c -> {
            if (!principal.getName().equals(c.getStudentUsername())) return ResponseEntity.status(403).build();
            if (sl.getStatus() != ScheduleSlot.Status.OPEN) return ResponseEntity.status(409).build();
            sl.setStatus(ScheduleSlot.Status.BOOKED);
            return ResponseEntity.ok(slots.save(sl));
        }).orElse(ResponseEntity.status(404).build())).orElse(ResponseEntity.status(404).build());
    }

    @PostMapping("/slots/{slotId}/cancel")
    public ResponseEntity<?> cancel(Principal principal, @PathVariable Long slotId) {
        return slots.findById(slotId).map(sl -> conversations.findById(sl.getConversationId()).map(c -> {
            boolean isCoach = principal.getName().equals(c.getCoachUsername());
            boolean isStudent = principal.getName().equals(c.getStudentUsername());
            if (!isCoach && !isStudent) return ResponseEntity.status(403).build();
            sl.setStatus(ScheduleSlot.Status.CANCELLED);
            slots.save(sl);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.status(404).build())).orElse(ResponseEntity.status(404).build());
    }

    // Coach approves a REQUESTED slot -> becomes BOOKED
    @PostMapping("/slots/{slotId}/approve")
    public ResponseEntity<?> approve(Principal principal, @PathVariable Long slotId) {
        return slots.findById(slotId).map(sl -> conversations.findById(sl.getConversationId()).map(c -> {
            if (!principal.getName().equals(c.getCoachUsername())) return ResponseEntity.status(403).build();
            if (sl.getStatus() != ScheduleSlot.Status.REQUESTED) return ResponseEntity.status(409).build();
            sl.setStatus(ScheduleSlot.Status.BOOKED);
            return ResponseEntity.ok(slots.save(sl));
        }).orElse(ResponseEntity.status(404).build())).orElse(ResponseEntity.status(404).build());
    }

    // Coach rejects a REQUESTED slot -> becomes REJECTED
    @PostMapping("/slots/{slotId}/reject")
    public ResponseEntity<?> reject(Principal principal, @PathVariable Long slotId) {
        return slots.findById(slotId).map(sl -> conversations.findById(sl.getConversationId()).map(c -> {
            if (!principal.getName().equals(c.getCoachUsername())) return ResponseEntity.status(403).build();
            if (sl.getStatus() != ScheduleSlot.Status.REQUESTED) return ResponseEntity.status(409).build();
            sl.setStatus(ScheduleSlot.Status.REJECTED);
            return ResponseEntity.ok(slots.save(sl));
        }).orElse(ResponseEntity.status(404).build())).orElse(ResponseEntity.status(404).build());
    }

    private boolean isParticipant(Principal p, Conversation c) {
        if (p == null) return false;
        String name = p.getName();
        return name.equals(c.getCoachUsername()) || name.equals(c.getStudentUsername());
    }
}


