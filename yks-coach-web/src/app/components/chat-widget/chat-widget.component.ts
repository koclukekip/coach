import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from 'app/services/chat.service';
import { AuthService } from 'app/services/auth.service';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss'
})
export class ChatWidgetComponent {
  isOpen = signal(false);
  messages = signal<ChatMessage[]>([]);
  pendingText = signal('');
  private mockToken = '';

  constructor(private chat: ChatService, private auth: AuthService) {
    this.chat.messages$.subscribe((msgs: ChatMessage[]) => this.messages.set(msgs));
    const token = this.auth.token;
    if (token) {
      this.chat.connect(token);
    }
  }

  toggle(): void { this.isOpen.update(v => !v); }

  send(): void {
    const text = this.pendingText().trim();
    if (!text) return;
    this.chat.send(text);
    this.pendingText.set('');
  }
}


