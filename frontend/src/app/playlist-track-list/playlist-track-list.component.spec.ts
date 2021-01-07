import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PlaylistTrackListComponent } from './playlist-track-list.component';

describe('TrackListComponent', () => {
  let component: PlaylistTrackListComponent;
  let fixture: ComponentFixture<PlaylistTrackListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PlaylistTrackListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaylistTrackListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
