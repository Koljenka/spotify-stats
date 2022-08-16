import {ApiPlaybackHistoryObject} from '@kn685832/spotify-api';
import {fromSpotifyTrack} from './ApiTrack';
import {fromSpotifyAudioFeatures} from './ApiAudioFeatures';
import {PlayHistoryObjectFull} from '../data-sharing.service';


export const fromSpotifyPlaybackHistoryObject = (p: PlayHistoryObjectFull): ApiPlaybackHistoryObject => ({
  playedAt: p.playedAt,
  track: fromSpotifyTrack(p.track), contextType: p.context.contextType,
  audioFeatures: fromSpotifyAudioFeatures(p.audioFeatures)
});

