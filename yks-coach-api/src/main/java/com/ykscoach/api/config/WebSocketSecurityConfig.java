package com.ykscoach.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.ykscoach.api.auth.JwtUtil;

import java.util.List;

@Configuration
public class WebSocketSecurityConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtUtil jwtUtil;

    public WebSocketSecurityConfig(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
				if (StompCommand.CONNECT.equals(accessor.getCommand())) {
					String auth = accessor.getFirstNativeHeader("Authorization");
					if (auth != null && auth.startsWith("Bearer ")) {
						String token = auth.substring(7);
						try {
							String username = jwtUtil.validateAndGetSubject(token);
							String role = jwtUtil.getRole(token);
							var authentication = new UsernamePasswordAuthenticationToken(
									username,
									null,
									role != null ? List.of(new SimpleGrantedAuthority("ROLE_" + role)) : List.of()
							);
							accessor.setUser(authentication);
						} catch (Exception ignored) { }
					}
				}
                return message;
            }
        });
    }
}


