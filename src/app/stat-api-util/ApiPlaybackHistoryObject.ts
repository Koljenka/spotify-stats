import {PlayHistoryObjectFull} from '../track-history/track-history.component';
import {ApiPlaybackHistoryObject} from '@kn685832/spotify-api';
import {fromSpotifyTrack} from './ApiTrack';
import {fromSpotifyAudioFeatures} from './ApiAudioFeatures';


export const fromSpotifyPlaybackHistoryObject = (p: PlayHistoryObjectFull): ApiPlaybackHistoryObject => ({
  playedAt: parseInt(p.added_at, 10),
  track: fromSpotifyTrack(p.track), contextType: p.context.contextType,
  audioFeatures: fromSpotifyAudioFeatures(p.audioFeatures)
});

