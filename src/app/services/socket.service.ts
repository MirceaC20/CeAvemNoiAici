import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

    constructor() {
        this.socket = io('http://localhost:3000');

        this.socket.on('connect', () => {
            console.log('✅ Connected to backend via socket.io');
        });

        this.socket.on('reveal-answer', data => {
            console.log('📡 Reveal-answer event received:', data);
        });
    }

    onWrongAnswer(): Observable<{ answerIndex: number }> {
    return new Observable(observer => {
        this.socket.on('wrong-answer', data => observer.next(data));
    });
    }

    emitRevealAnswer(questionIndex: number, answerIndex: number) {
        this.socket.emit('reveal-answer', { questionIndex, answerIndex });
    }

    onAnswerRevealed(): Observable<{ questionIndex: number; answerIndex: number }> {
    return new Observable(observer => {
        this.socket.on('reveal-answer', data => {
        console.log('📥 Observable triggered for reveal-answer:', data);
        observer.next(data);
        });
    });
    }
}
