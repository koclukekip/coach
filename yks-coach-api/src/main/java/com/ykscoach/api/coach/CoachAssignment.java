package com.ykscoach.api.coach;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "coach_assignments", uniqueConstraints = {
        @UniqueConstraint(name = "uk_coach_assignments_student", columnNames = {"studentUsername"})
})
public class CoachAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String studentUsername;

    @Column(nullable = false)
    private String coachUsername;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStudentUsername() { return studentUsername; }
    public void setStudentUsername(String studentUsername) { this.studentUsername = studentUsername; }

    public String getCoachUsername() { return coachUsername; }
    public void setCoachUsername(String coachUsername) { this.coachUsername = coachUsername; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}


