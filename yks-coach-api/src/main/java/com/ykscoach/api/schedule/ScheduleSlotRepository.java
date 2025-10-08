package com.ykscoach.api.schedule;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScheduleSlotRepository extends JpaRepository<ScheduleSlot, Long> {
    List<ScheduleSlot> findByConversationIdOrderByStartAsc(Long conversationId);
    @org.springframework.data.jpa.repository.Query("select s from ScheduleSlot s join com.ykscoach.api.chat.Conversation c on c.id=s.conversationId where c.coachUsername=:coach order by s.start asc")
    List<ScheduleSlot> findAllForCoach(String coach);
}


