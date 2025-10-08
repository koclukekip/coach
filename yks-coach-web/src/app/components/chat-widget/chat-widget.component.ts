import { Component, signal, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
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
export class ChatWidgetComponent implements AfterViewInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  isOpen = signal(false);
  messages = signal<ChatMessage[]>([]);
  pendingText = signal('');
  private mockToken = '';

  constructor(private chat: ChatService, private auth: AuthService, private cdr: ChangeDetectorRef) {
    this.chat.messages$.subscribe((msgs: ChatMessage[]) => {
      this.messages.set(msgs);
      this.cdr.detectChanges();
      // Yeni mesaj geldiğinde otomatik scroll - öğrenci tarafındaki gibi
      this.safeScrollToBottom();
    });
    const token = this.auth.token;
    if (token) {
      this.chat.connect(token);
    }
  }

  ngAfterViewInit(): void {
    // Component yüklendiğinde scroll
    this.safeScrollToBottom();
  }

  toggle(): void { 
    this.isOpen.update(v => !v);
    // Chat açıldığında scroll
    if (this.isOpen()) {
      this.safeScrollToBottom();
    }
  }

  send(): void {
    const text = this.pendingText().trim();
    if (!text) return;
    this.chat.send(text);
    this.pendingText.set('');
    // Mesaj gönderildikten sonra scroll
    this.safeScrollToBottom();
  }

  private scrollToBottom(): void {
    this.safeScrollToBottom();
  }

  private safeScrollToBottom(): void {
    requestAnimationFrame(() => {
      const el = this.messagesContainer?.nativeElement;
      if (!el) return;
      // run twice to ensure after ngFor renders
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    });
  }

  trackByMessage(index: number, message: ChatMessage): string | number {
    return message.id || index;
  }
}


