package com.ykscoach.api.presence;

import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {
    private final Map<String, Instant> lastSeen = new ConcurrentHashMap<>();
    private static final long ONLINE_THRESHOLD_SECONDS = 60; // 1 minute

    public void heartbeat(String username) {
        if (username != null && !username.isBlank()) {
            lastSeen.put(username, Instant.now());
        }
    }

    public boolean isOnline(String username) {
        Instant t = lastSeen.get(username);
        return t != null && Instant.now().minusSeconds(ONLINE_THRESHOLD_SECONDS).isBefore(t);
    }

    public Map<String, Boolean> batch(Set<String> users) {
        return users.stream().collect(java.util.stream.Collectors.toMap(u -> u, this::isOnline));
    }
}


