import AudioFeaturesObject = SpotifyApi.AudioFeaturesObject;
import {ApiAudioFeatures} from '@kn685832/spotify-api';


export const fromSpotifyAudioFeatures = (f: AudioFeaturesObject): ApiAudioFeatures => {
  if (f == null) {
    return null;
  }
  return {danceability: f.danceability, energy: f.energy, key: f.key, mode: f.mode, tempo: f.tempo, valence: f.valence};
};

