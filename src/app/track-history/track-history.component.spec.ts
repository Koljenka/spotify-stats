import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TrackHistoryComponent } from './track-history.component';

describe('TrackHistoryComponent', () => {
  let component: TrackHistoryComponent;
  let fixture: ComponentFixture<TrackHistoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
