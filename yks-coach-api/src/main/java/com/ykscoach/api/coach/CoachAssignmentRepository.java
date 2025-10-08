package com.ykscoach.api.coach;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface CoachAssignmentRepository extends JpaRepository<CoachAssignment, Long> {
    Optional<CoachAssignment> findByStudentUsername(String studentUsername);
    List<CoachAssignment> findByCoachUsername(String coachUsername);
}


