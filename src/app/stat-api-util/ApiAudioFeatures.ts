import AudioFeaturesObject = SpotifyApi.AudioFeaturesObject;

export class ApiAudioFeatures {
  private id: string;
  private acousticness: number;
  private danceability: number;
  private energy: number;
  private instrumentalness: number;
  private key: number;
  private liveness: number;
  private loudness: number;
  private mode: number;
  private speechiness: number;
  private tempo: number;
  private timeSignature: number;
  private valence: number;


  constructor(id: string, acousticness: number, danceability: number, energy: number, instrumentalness: number,
              key: number, liveness: number, loudness: number, mode: number, speechiness: number, tempo: number,
              timeSignature: number, valence: number) {
    this.id = id;
    this.acousticness = acousticness;
    this.danceability = danceability;
    this.energy = energy;
    this.instrumentalness = instrumentalness;
    this.key = key;
    this.liveness = liveness;
    this.loudness = loudness;
    this.mode = mode;
    this.speechiness = speechiness;
    this.tempo = tempo;
    this.timeSignature = timeSignature;
    this.valence = valence;
  }

  public static fromSpotifyAudioFeatures(f: AudioFeaturesObject): ApiAudioFeatures {
    if (f == null) {
      return null;
    }
    return new ApiAudioFeatures(f.id, f.acousticness, f.danceability, f.energy, f.instrumentalness, f.key, f.liveness,
      f.loudness, f.mode, f.speechiness, f.tempo, f.time_signature, f.valence);
  }
}
