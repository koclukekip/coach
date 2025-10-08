package com.ykscoach.api.chat;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "conversations")
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String studentUsername;

    @Column(nullable = false)
    private String coachUsername;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant studentLastReadAt = Instant.EPOCH;

    @Column(nullable = false)
    private Instant coachLastReadAt = Instant.EPOCH;

    public enum Status { PENDING, ACCEPTED, REJECTED }

    public Long getId() { return id; }
    public String getStudentUsername() { return studentUsername; }
    public void setStudentUsername(String studentUsername) { this.studentUsername = studentUsername; }
    public String getCoachUsername() { return coachUsername; }
    public void setCoachUsername(String coachUsername) { this.coachUsername = coachUsername; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getStudentLastReadAt() { return studentLastReadAt; }
    public void setStudentLastReadAt(Instant t) { this.studentLastReadAt = t; }

    public Instant getCoachLastReadAt() { return coachLastReadAt; }
    public void setCoachLastReadAt(Instant t) { this.coachLastReadAt = t; }
}


