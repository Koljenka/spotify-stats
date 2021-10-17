import {AfterViewInit, Component, OnInit} from '@angular/core';
import SavedTrackObject = SpotifyApi.SavedTrackObject;
import {ApiConnectionService} from '../api-connection.service';
import {BehaviorSubject} from 'rxjs';
import {Title} from '@angular/platform-browser';

@Component({
  selector: 'app-saved-track-list',
  templateUrl: './saved-track-list.component.html',
  styleUrls: ['./saved-track-list.component.css']
})
export class SavedTrackListComponent implements OnInit, AfterViewInit {
  savedTracksSource = new BehaviorSubject(new Array<SavedTrackObject>());

  constructor(private api: ApiConnectionService, private titleService: Title) {
  }

  ngOnInit(): void {
    this.titleService.setTitle('My Library - SpotifyStats');
  }

  ngAfterViewInit(): void {
    this.getSavedTracks();
  }

  getSavedTracks(offset: number = 0, limit: number = 50): void {
    this.api.getApi().getMySavedTracks({offset, limit}).then(value => {
      this.savedTracksSource.next(value.items);
      if (value.next != null) {
        const parts = value.next.split(/=|&|\?/);
        this.getSavedTracks(parseInt(parts[parts.indexOf('offset') + 1], 10), parseInt(parts[parts.indexOf('limit') + 1], 10));
      } else {
        this.savedTracksSource.complete();
      }
    });
  }
}

