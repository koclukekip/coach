package com.ykscoach.api.chat;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.security.Principal;

@Controller
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;
    private final ConversationRepository conversations;
    private final MessageRepository messages;

    public ChatController(SimpMessagingTemplate messagingTemplate, ConversationRepository conversations, MessageRepository messages) {
        this.messagingTemplate = messagingTemplate;
        this.conversations = conversations;
        this.messages = messages;
    }

    public static record ChatMessage(Long conversationId, String from, String text) {}

    @MessageMapping("/chat.send")
    public void handleChat(@Payload ChatMessage message, Principal principal) {
        // Simple validation: conversation exists and accepted
        conversations.findById(message.conversationId()).ifPresent(conv -> {
            if (conv.getStatus() == Conversation.Status.ACCEPTED) {
                String sender = principal != null ? principal.getName() : message.from();
                // persist
                Message m = new Message();
                m.setConversationId(message.conversationId());
                m.setFromUsername(sender);
                m.setText(message.text());
                messages.save(m);

                String dest = "/topic/conversations/" + message.conversationId();
                messagingTemplate.convertAndSend(dest, new ChatMessage(message.conversationId(), sender, message.text()));
            }
        });
    }
}


