import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuestionSyncService {
  private apiUrl = 'http://10.235.215.198:3000/api';
  private getQuestions = this.apiUrl + '/questions';
  private currentQuestion = this.apiUrl + '/current-question';
  private used = this.apiUrl + '/used';
  private score = this.apiUrl + '/score';
  private scoreboard = this.apiUrl + '/scoreboard';

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

  getUsedTeamNames(): Observable<{ usedTeamNames: string[] }> {
  return this.http.get<{ usedTeamNames: string[] }>(this.apiUrl + '/used-team-names');
  }

  saveTeamScore(teamName: string, score: number): Observable<any> {
    return this.http.post(this.score, { teamName, score });
  }

  loadScoreboard(): Observable<any> {
    return this.http.get(this.scoreboard);
  }
}

