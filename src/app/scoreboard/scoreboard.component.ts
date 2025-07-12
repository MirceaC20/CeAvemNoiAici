import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-scoreboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scoreboard.component.html',
  styleUrls: ['./scoreboard.component.scss']
})
export class ScoreboardComponent implements OnInit {
  scores: { teamName: string, scores: number[], total: number, maxScore: number }[] = [];
  readonly backendUrl = 'http://10.235.215.198:3000';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any>(`${this.backendUrl}/api/scoreboard`).subscribe({
      next: (data) => {
        this.scores = (data.teams || [])
          .map((entry: { name: string; scores: number[] }) => {
            const maxScore = Math.max(...entry.scores);
            const total = entry.scores.reduce((acc: number, val: number) => acc + val, 0)
            return {
              teamName: entry.name,
              scores: entry.scores,
              total,
              maxScore
            };
          })
          .sort((a: { maxScore: number; }, b: { maxScore: number; }) => b.maxScore - a.maxScore); // sortăm după cel mai mare scor individual
      },
      error: err => console.error('❌ Could not load scoreboard', err)
    });
  }
}
