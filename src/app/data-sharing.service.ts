import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import SavedTrackObject = SpotifyApi.SavedTrackObject;

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {
  private savedTrackListSource = new BehaviorSubject(new Array<SavedTrackObject>());
  savedTrackList = this.savedTrackListSource.asObservable();

  constructor() { }

  changeSavedTrackList(trackList: Array<SavedTrackObject>): void {
    this.savedTrackListSource.next(trackList);
  }
}
