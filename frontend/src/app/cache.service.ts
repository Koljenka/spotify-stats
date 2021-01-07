import {Injectable} from '@angular/core';
import SavedTrackObject = SpotifyApi.SavedTrackObject;

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly SAVED_TRACKS = 'savedTracks';

  constructor() {

  }

  public getSavedTracks(forceRequest: boolean): SavedTrackObject[] {
    if (sessionStorage.getItem(this.SAVED_TRACKS) != null) {

    }

    return [];
  }


}
