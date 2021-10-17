import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackListHeaderComponent } from './track-list-header.component';

describe('TrackListHeaderComponent', () => {
  let component: TrackListHeaderComponent;
  let fixture: ComponentFixture<TrackListHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrackListHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackListHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
