import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackMainComponent } from './track-main.component';

describe('TrackComponent', () => {
  let component: TrackMainComponent;
  let fixture: ComponentFixture<TrackMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrackMainComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
