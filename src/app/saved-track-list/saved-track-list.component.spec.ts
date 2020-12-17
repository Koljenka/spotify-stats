import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SavedTrackListComponent } from './saved-track-list.component';

describe('TrackListComponent', () => {
  let component: SavedTrackListComponent;
  let fixture: ComponentFixture<SavedTrackListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SavedTrackListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SavedTrackListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
