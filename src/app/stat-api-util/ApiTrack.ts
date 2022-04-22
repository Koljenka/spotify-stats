import TrackObjectSimplified = SpotifyApi.TrackObjectSimplified;

export class ApiTrack {
  private id: string;
  private name: string;
  private duration: number;


  constructor(id: string, name: string, duration: number) {
    this.id = id;
    this.name = name;
    this.duration = duration;
  }

  public static fromSpotifyTrack(track: TrackObjectSimplified): ApiTrack {
    return new ApiTrack(track.id, track.name, track.duration_ms);
  }
}
