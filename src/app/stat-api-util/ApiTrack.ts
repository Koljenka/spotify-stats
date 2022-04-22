import TrackObjectSimplified = SpotifyApi.TrackObjectSimplified;

export class ApiTrack {
  private id: string;
  private name: string;
  private duration: number;
  private artist: string;

  constructor(id: string, name: string, duration: number, artist: string) {
    this.id = id;
    this.name = name;
    this.duration = duration;
    this.artist = artist;
  }

  public static fromSpotifyTrack(track: TrackObjectSimplified): ApiTrack {
    return new ApiTrack(track.id, track.name, track.duration_ms, track.artists[0].name);
  }
}
