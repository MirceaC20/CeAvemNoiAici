import { TestBed, ComponentFixture, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { GameComponent } from './game';
export interface Question {
  question: string;
  answers: { text: string; points: number; revealed?: boolean }[];
}

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let httpMock: HttpTestingController;

  const mockQuestions = [
    {
      question: 'Cati cai pot fi inhamati?',
      answers: [
        { text: '6', points: 42 },
        { text: '5', points: 17 }
      ]
    }
  ];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [],
      declarations: [],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges(); // declanșează ngOnInit()
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load questions from JSON', () => {
    const req = httpMock.expectOne('assets/questions.json');
    expect(req.request.method).toBe('GET');

    req.flush(mockQuestions); // simulăm răspunsul

    expect(component.questions.length).toBe(1);
    expect(component.currentQuestion?.question).toContain('bloc');
  });

  it('should reveal answer and update score', () => {
    const req = httpMock.expectOne('assets/questions.json');
    req.flush(mockQuestions);

    component.reveal(0); // index 0 = Cai (42)

    expect(component.currentQuestion?.answers[0].revealed).toBeTrue();
    expect(component.teamScores[0]).toBe(42);
  });

  it('should handle wrong answers', () => {
    component.wrongAnswer();
    expect(component.wrongGuesses).toBe(1);
  });

  it('should go to next question and switch player', () => {
    const req = httpMock.expectOne('assets/questions.json');
    req.flush([...mockQuestions, ...mockQuestions]);

    component.nextQuestion();
    expect(component.currentPlayer).toBe(1);
    expect(component.currentQuestionIndex).toBe(1);
  });

  afterEach(() => {
    httpMock.verify();
  });
});
