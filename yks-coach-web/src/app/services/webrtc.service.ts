import { Injectable, signal } from '@angular/core';
import * as StompJs from '@stomp/stompjs';
import { AuthService } from 'app/services/auth.service';

type Signal = { conversationId: number; from: string; type: 'offer'|'answer'|'candidate'|'bye'; data: string };

@Injectable({ providedIn: 'root' })
export class WebRtcService {
  private pc?: RTCPeerConnection;
  private stomp?: any;
  private subscribedConvId: number | null = null;
  localStream = signal<MediaStream | null>(null);
  remoteStream = signal<MediaStream | null>(null);
  private currentUsername: string | null = null;
  private stopTimer?: any;

  constructor(private auth: AuthService) {
    const token = this.auth.token;
    if (token) this.currentUsername = this.parseUsernameFromToken(token);
  }

  async start(conversationId: number): Promise<void> {
    await this.ensureConnection();
    await this.ensureStreams();
    this.subscribe(conversationId);
    await this.createAndSendOffer(conversationId);
    // Auto-timeout to avoid long-lived connections
    clearTimeout(this.stopTimer);
    this.stopTimer = setTimeout(() => { try { this.stop(); } catch {} }, 1000 * 60 * 30); // 30 minutes max
  }

  async accept(conversationId: number): Promise<void> {
    await this.ensureConnection();
    await this.ensureStreams();
    this.subscribe(conversationId);
  }

  stop(): void {
    try { clearTimeout(this.stopTimer); } catch {}
    try { this.subscribedConvId = null; } catch {}
    try { this.pc?.close(); } catch {}
    this.pc = undefined;
    const ls = this.localStream();
    ls?.getTracks().forEach(t => t.stop());
    this.localStream.set(null);
    this.remoteStream.set(null);
  }

  private async ensureConnection(): Promise<void> {
    if (this.pc) return;
    this.pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    const remote = new MediaStream();
    this.remoteStream.set(remote);
    this.pc.ontrack = (ev) => {
      ev.streams[0]?.getTracks().forEach(track => remote.addTrack(track));
    };
    this.pc.onicecandidate = (ev) => {
      if (ev.candidate && this.subscribedConvId != null) {
        const payload: Signal = { conversationId: this.subscribedConvId, from: this.currentUsername || 'me', type: 'candidate', data: JSON.stringify(ev.candidate) };
        this.stomp?.publish({ destination: '/app/webrtc.signal', body: JSON.stringify(payload) });
      }
    };
  }

  private async ensureStreams(): Promise<void> {
    if (!this.localStream()) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.localStream.set(stream);
      stream.getTracks().forEach(t => this.pc?.addTrack(t, stream));
    }
  }

  private subscribe(conversationId: number): void {
    if (this.subscribedConvId === conversationId) return;
    this.subscribedConvId = conversationId;
    if (!this.stomp) {
      import('sockjs-client').then((mod) => {
        const SockJS = (mod as any).default || (mod as any);
        const socket = new SockJS('/ws');
        this.stomp = StompJs.Stomp.over(socket as any);
        this.stomp.reconnectDelay = 0; // no auto-reconnect, keep session short-lived
        const token = this.auth.token || undefined;
        if (token) this.currentUsername = this.parseUsernameFromToken(token);
        const headers = token ? { Authorization: `Bearer ${token}` } : {} as any;
        this.stomp.connect(headers, () => {
          this.subscribeTopic(conversationId);
        });
      });
    } else {
      this.subscribeTopic(conversationId);
    }
  }

  private subscribeTopic(conversationId: number): void {
    this.stomp.subscribe(`/topic/webrtc/${conversationId}`, async (msg: any) => {
      try {
        const incoming = JSON.parse(msg.body) as Signal;
        if (incoming.from === this.currentUsername) return; // ignore self
        if (!this.pc) await this.ensureConnection();
        if (!this.localStream()) await this.ensureStreams();
        if (incoming.type === 'offer') {
          await this.pc!.setRemoteDescription(new RTCSessionDescription(JSON.parse(incoming.data)));
          const answer = await this.pc!.createAnswer();
          await this.pc!.setLocalDescription(answer);
          const payload: Signal = { conversationId, from: this.currentUsername || 'me', type: 'answer', data: JSON.stringify(answer) };
          this.stomp.publish({ destination: '/app/webrtc.signal', body: JSON.stringify(payload) });
        } else if (incoming.type === 'answer') {
          await this.pc!.setRemoteDescription(new RTCSessionDescription(JSON.parse(incoming.data)));
        } else if (incoming.type === 'candidate') {
          await this.pc!.addIceCandidate(new RTCIceCandidate(JSON.parse(incoming.data)));
        }
      } catch {}
    });
  }

  private async createAndSendOffer(conversationId: number): Promise<void> {
    const offer = await this.pc!.createOffer();
    await this.pc!.setLocalDescription(offer);
    const payload: Signal = { conversationId, from: this.currentUsername || 'me', type: 'offer', data: JSON.stringify(offer) };
    this.stomp?.publish({ destination: '/app/webrtc.signal', body: JSON.stringify(payload) });
  }

  private parseUsernameFromToken(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
      return payload?.sub ?? null;
    } catch {
      return null;
    }
  }
}


