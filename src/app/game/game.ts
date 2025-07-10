import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoScaleDirective } from './directives/auto-scale.directive';
import { QuestionSyncService } from '../services/question-sync.service';
import { SocketService } from '../services/socket.service'; //

interface Answer {
  text: string;
  points: number;
  revealed: boolean;
  rank?: number;
}

interface Question {
  question: string;
  answers: Answer[];
  index: number;
}

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoScaleDirective],
  templateUrl: './game.html',
  styleUrls: ['./game.scss'],
})
export class GameComponent implements OnInit {

  constructor(
    private http: HttpClient, 
    private questionSync: QuestionSyncService,
    private socketService: SocketService) {}

  @ViewChild('autoScale1') autoScale1!: AutoScaleDirective;
  @ViewChild('autoScale2') autoScale2!: AutoScaleDirective;

  questions: Question[] = [];
  currentQuestionIndex = 0;
  currentQuestion: Question | null = null;
  usedQuestions: number[] = [];

  playerScores = [0, 0];
  currentPlayer = 0;
  wrongGuesses = [0, 0];

  roundNumber = 1;
  roundMultiplier = 1;
  roundPoints = 0;
  doublePoints = false;
  triplePoints = false;
  teamNames = ['Echipa 1', 'Echipa 2'];
  readyForNext = false;
  showBigX = false;
  
  availableTeamNames: string[] = [];
  
  visibleAnswers: boolean[] = [];
  usedQuestionIndices: Set<number> = new Set();

  introAudio = new Audio('assets/sounds/intro.mp3');
  roundEndAudio = new Audio('assets/sounds/round-ending.mp3');
  wrongSound = new Audio('assets/sounds/wrong.mp3');
  correctAudio = new Audio('assets/sounds/correct.mp3');
  tick = new Audio('assets/sounds/tick.mp3');

  lastAssignment: { teamIndex: number; points: number } | null = null;

  ngOnInit() {
    this.wrongSound.load();
    this.loadInitialUsedQuestions();

    this.questionSync.loadQuestions().subscribe((questions) => {
      this.questions = questions;
      this.loadCurrentQuestion(true);
    });

    this.socketService.onAnswerRevealed().subscribe(({ questionIndex, answerIndex }) => {
      console.log('Received reveal from socket:', questionIndex, answerIndex);
      this.reveal(answerIndex);
    });

    this.http.get<{ echipe: string[] }>('assets/teams.json').subscribe({
      next: (data) => {
        this.availableTeamNames = data.echipe;
      },
      error: (err) => console.error('Eroare la încărcarea echipelor:', err)
    });

    this.socketService.onWrongAnswer().subscribe(data => {
      this.wrongAnswer(); // metoda care deja există în componentă
    });
  }

  loadInitialUsedQuestions() {
    this.questionSync.loadUsedQuestions().subscribe({
      next: (data) => {
        this.usedQuestions = data.usedQuestionIndexes || [];
      },
      error: (err) => {
        console.error('Eroare la încărcarea întrebărilor folosite:', err);
      }
    });
  }

  playIntroSound() {
    this.introAudio.currentTime = 0;
    this.introAudio.play();
    this.readyForNext = true; // marcăm că putem merge la următoarea întrebare
  }

  resetGame() {
    this.playerScores = [0, 0];
    this.wrongGuesses = [0, 0];
    this.roundPoints = 0;
    this.roundMultiplier = 1;
    this.roundNumber = 1;

    // opțional: resetează echipele la numele implicite
     this.teamNames = ['Echipa 1', 'Echipa 2'];

    // Rămânem pe întrebarea curentă, doar că începem scorul de la 0
    this.loadCurrentQuestion();
  }

  loadCurrentQuestion(isFirstQuestion: boolean = false) {

    if (isFirstQuestion) {
      // alegem un index random care nu a mai fost folosit
      const index = randomBetweenExcludingUsed(
        0,
        this.questions.length - 1,
        this.usedQuestions
      );

      this.currentQuestionIndex = index;
    }

    const question = this.questions.find(q => q.index === this.currentQuestionIndex);

    // sortăm răspunsurile după punctaj și atribuim ranguri (1, 2, 3, ...)
    const sortedAnswers = [...question!.answers]
      .sort((a, b) => b.points - a.points)
      .map((a, i) => ({ ...a, revealed: false, rank: i + 1 }));

    this.currentQuestion = {
      question: question!.question,
      answers: sortedAnswers,
      index: question!.index,
    };

    this.usedQuestions.push(this.currentQuestionIndex); // adăugăm întrebarea la cele folosite
    this.roundPoints = 0;         // resetăm punctajul rundei
    this.roundMultiplier = 1;     // resetăm multiplicatorul (x1)
    this.wrongGuesses = [0, 0];   // resetăm greșelile
    this.readyForNext = false;    // marcăm că putem merge la următoarea întrebare

    this.visibleAnswers = new Array(this.currentQuestion.answers.length).fill(false);
    this.animateMaskedAnswersIn();

    this.questionSync.pushCurrentQuestion(this.currentQuestionIndex);
  }

  animateMaskedAnswersIn() {
    this.tick.play();
    this.currentQuestion?.answers.forEach((_, i) => {
      setTimeout(() => {
        this.visibleAnswers[i] = true;
      }, i * 250);
    });
  }

  reveal(index: number) {
    if (!this.currentQuestion) return;

    const ans = this.currentQuestion.answers[index];
    if (!ans.revealed) {
      ans.revealed = true;
      this.roundPoints += ans.points;

      // Play correct answer sound
      this.correctAudio.currentTime = 0;
      this.correctAudio.play();
    }
  }

  createArray(n: number): any[] {
    return Array(n);
  }

  assignPointsToTeam(teamIndex: number) {
    if (this.lastAssignment) return; // deja s-au atribuit punctele în această rundă

    const points = this.adjustedRoundPoints();
    this.playerScores[teamIndex] += points;

    this.roundEndAudio.currentTime = 0;
    this.roundEndAudio.play();

    this.lastAssignment = {
      teamIndex,
      points
    };
    this.readyForNext = true;
  }

  undoLastAssignment() {
    if (!this.lastAssignment) return;

    const { teamIndex, points } = this.lastAssignment;
    this.playerScores[teamIndex] -= points;
    this.lastAssignment = null;
    this.readyForNext = false;
  }

  nextQuestion() {
    this.roundNumber++;
    this.lastAssignment = null;

    this.questionSync.addUsedQuestion(this.currentQuestionIndex).subscribe({
      error: (err) => console.error('Eroare la salvarea indexului în backend:', err)
    });

    this.currentQuestionIndex = randomBetweenExcludingUsed(1, this.questions.length - 1, this.usedQuestions || []);

    if (this.currentQuestionIndex < this.questions.length) {
      this.loadCurrentQuestion();
      this.roundMultiplier = this.getAutoMultiplier();
    } else {
      this.currentQuestion = null;
    }
  }

  getAutoMultiplier(): number {
    if (this.roundNumber >= 6) return 3;
    if (this.roundNumber >= 4) return 2;
    return 1;
  }

  adjustedRoundPoints(): number {
  return this.roundPoints * this.roundMultiplier;
  }

  increaseMultiplier(): void {
    if (this.roundMultiplier < 3) {
      this.roundMultiplier++;
    }
  }

  decreaseMultiplier(): void {
    if (this.roundMultiplier > 1) {
      this.roundMultiplier--;
    }
  }

  wrongAnswer() {

    this.wrongSound.currentTime = 0; // resetează sunetul dacă e deja în redare
    this.wrongSound.play();

    setTimeout(() => {
      this.showBigX = true;
      this.wrongGuesses[this.currentPlayer]++;

      // Dispare după 2 secunde
      setTimeout(() => {
        this.showBigX = false;
      }, 2000);
    }, 500);
  }
  leftAnswers(): Answer[] {
    return this.currentQuestion?.answers.filter((_, i) => i % 2 === 0) || [];
  }

  rightAnswers(): Answer[] {
    return this.currentQuestion?.answers.filter((_, i) => i % 2 !== 0) || [];
  }

  get questionStats() {
  const total = this.questions?.length || 0;
  const used = this.usedQuestions.length;
  const remaining = total - used;
  return { total, used, remaining };
  }

setRandomTeamName(teamIndex: number) {
    if (this.availableTeamNames.length === 0) return;

    const used = new Set(this.teamNames);
    const filtered = this.availableTeamNames.filter(name => !used.has(name));
    const pool = filtered.length > 0 ? filtered : this.availableTeamNames;

    const random = pool[Math.floor(Math.random() * pool.length)];
    this.teamNames[teamIndex] = random;

    // Apelează resize explicit după setare
    setTimeout(() => {
      if (teamIndex === 0) {
        this.autoScale1?.resize();
      } else {
        this.autoScale2?.resize();
      }
    });
  }

  logAvailableQuestionIndexes() {
    const available: number[] = [];
    const total = this.questions.forEach(Q => available.push(Q.index))
    const used = this.usedQuestions || [];

    console.log('Indexii întrebărilor disponibile:', available.filter(idx => !used.includes(idx)));
    }

}

function randomBetweenExcludingUsed(min: number, max: number, used: number[]): number {
  const available = [];
  for (let i = min; i <= max; i++) {
    if (!used.includes(i)) {
      available.push(i);
    }
  }
  if (available.length === 0) return min; // fallback
  const idx = Math.floor(Math.random() * available.length);
  return available[idx];
}



