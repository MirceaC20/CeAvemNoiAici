import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuestionSyncService {
  private apiUrl = 'http://localhost:3000/api';
  private getQuestions = this.apiUrl + '/questions';
  private currentQuestion = this.apiUrl + '/current-question';
  private used = this.apiUrl + '/used';

  constructor(private http: HttpClient) {}

  loadUsedQuestions(): Observable<{ usedQuestionIndexes: number[] }> {
    return this.http.get<{ usedQuestionIndexes: number[] }>(this.used);
  }

  addUsedQuestion(index: number): Observable<any> {
    return this.http.post(this.used, { index });
  }

  loadQuestions(): Observable<any[]> {
    return this.http.get<any[]>(this.getQuestions);
  }

  pushCurrentQuestion(index: number) {
    return this.http.post(this.currentQuestion, { index }).subscribe({
      next: () => console.log(`✅ Pushed current question index: ${index}`),
      error: err => console.error('❌ Failed to push current question:', err)
    });
  }
}
