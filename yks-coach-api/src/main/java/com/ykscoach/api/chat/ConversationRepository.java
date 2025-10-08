package com.ykscoach.api.chat;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByCoachUsername(String coachUsername);
    List<Conversation> findByStudentUsername(String studentUsername);
    Optional<Conversation> findByIdAndCoachUsername(Long id, String coachUsername);
}


