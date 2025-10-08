package com.ykscoach.api.webrtc;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.ykscoach.api.chat.Conversation;
import com.ykscoach.api.chat.ConversationRepository;

import java.security.Principal;

@Controller
public class WebRtcController {
    private final SimpMessagingTemplate messagingTemplate;
    private final ConversationRepository conversations;

    public WebRtcController(SimpMessagingTemplate messagingTemplate, ConversationRepository conversations) {
        this.messagingTemplate = messagingTemplate;
        this.conversations = conversations;
    }

    public static record Signal(Long conversationId, String from, String type, String data) {}

    @MessageMapping("/webrtc.signal")
    public void signal(@Payload Signal signal, Principal principal) {
        conversations.findById(signal.conversationId()).ifPresent(conv -> {
            if (conv.getStatus() == Conversation.Status.ACCEPTED) {
                String sender = principal != null ? principal.getName() : signal.from();
                var outbound = new Signal(signal.conversationId(), sender, signal.type(), signal.data());
                String dest = "/topic/webrtc/" + signal.conversationId();
                messagingTemplate.convertAndSend(dest, outbound);
            }
        });
    }
}


