import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HistoryStatsComponent } from './history-stats.component';

describe('HistoryStatsComponent', () => {
  let component: HistoryStatsComponent;
  let fixture: ComponentFixture<HistoryStatsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HistoryStatsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoryStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
