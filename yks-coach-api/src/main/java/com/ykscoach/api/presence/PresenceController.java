package com.ykscoach.api.presence;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.Set;

record BatchRequest(Set<String> users) {}

@RestController
@RequestMapping("/api/presence")
@CrossOrigin
public class PresenceController {
    private final PresenceService presence;

    public PresenceController(PresenceService presence) {
        this.presence = presence;
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<?> heartbeat(Principal principal) {
        String name = principal != null ? principal.getName() : null;
        presence.heartbeat(name);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/batch")
    public Map<String, Boolean> batch(@RequestBody BatchRequest req) {
        return presence.batch(req.users());
    }
}


