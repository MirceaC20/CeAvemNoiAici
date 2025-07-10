import { TestBed } from '@angular/core/testing';

import { QuestionSyncService } from './question-sync.service';

describe('QuestionSyncService', () => {
  let service: QuestionSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuestionSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
