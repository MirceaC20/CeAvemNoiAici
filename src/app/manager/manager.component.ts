import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-manager',
  standalone: true,
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.scss'],
  imports: [CommonModule]
})
export class ManagerComponent implements OnInit {
  currentQuestion: any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchCurrentQuestion();
  }

  fetchCurrentQuestion() {
    this.http.get<any>('http://localhost:3000/api/current-question').subscribe({
      next: (data) => {
        this.currentQuestion = data;
      },
      error: (err) => {
        console.error('❌ Failed to load current question', err);
      }
    });
  }

  triggerWrongAnswer() {
    if (!this.currentQuestion) return;
    const index = this.currentQuestion.index;

    this.http.get(`http://localhost:3000/api/current-question/${index}/wrong`).subscribe({
      next: () => console.log('Wrong answer triggered'),
      error: err => console.error('Failed to trigger wrong answer', err)
    });
  }

  revealAnswer(index: number) {
    const qIndex = this.currentQuestion?.index;
    if (qIndex == null) return;

    this.http.get(`http://localhost:3000/api/questions/${qIndex}/reveal/${index}`).subscribe({
      next: () => {
        console.log(`✅ Revealed answer ${index} for question ${qIndex}`);
      },
      error: (err) => {
        console.error('❌ Failed to trigger reveal', err);
      }
    });
  }
}
