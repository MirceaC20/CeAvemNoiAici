import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-manager',
  standalone: true,
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class ManagerComponent implements OnInit {
  currentQuestion: any = null;
  questionNumberInput: number | null = null;
  readonly backendUrl = 'http://192.168.1.137:3000';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchCurrentQuestion();
  }

  fetchCurrentQuestion(): void {
    this.http.get<any>(`${this.backendUrl}/api/current-question`).subscribe({
      next: (data) => (this.currentQuestion = data),
      error: (err) =>
        console.error('❌ Failed to load current question', err),
    });
  }

  fetchQuestionByNumber(): void {
    const index = this.questionNumberInput;
    if (index == null || isNaN(index)) return;

    this.http.get<any>(`${this.backendUrl}/api/question/${index}`).subscribe({
      next: (data) => (this.currentQuestion = data),
      error: (err) => console.error('❌ Failed to load question', err),
    });
  }

  revealAnswer(index: number): void {
    const qIndex = this.currentQuestion?.index;
    if (qIndex == null) return;

    this.http
      .get(`${this.backendUrl}/api/questions/${qIndex}/reveal/${index}`)
      .subscribe({
        next: () =>
          console.log(`✅ Revealed answer ${index} for question ${qIndex}`),
        error: (err) =>
          console.error('❌ Failed to trigger answer reveal', err),
      });
  }

  triggerWrongAnswer(): void {
    const index = this.currentQuestion?.index;
    if (index == null) return;

    this.http
      .get(`${this.backendUrl}/api/current-question/${index}/wrong`)
      .subscribe({
        next: () => console.log('⚠️ Wrong answer triggered'),
        error: (err) =>
          console.error('❌ Failed to trigger wrong answer', err),
      });
  }
}
