import {PlayHistoryObjectFull} from '../track-history/track-history.component';
import {ApiTrack} from './ApiTrack';
import {ApiAudioFeatures} from './ApiAudioFeatures';

export class ApiPlaybackHistoryObject {
  private playedAt: number;
  private track: ApiTrack;
  private contextType: string;
  private audioFeatures: ApiAudioFeatures;


  constructor(playedAt: number, track: ApiTrack, contextType: string, audioFeatures: ApiAudioFeatures) {
    this.playedAt = playedAt;
    this.track = track;
    this.contextType = contextType;
    this.audioFeatures = audioFeatures;
  }

  public static fromSpotifyPlaybackHistoryObject(p: PlayHistoryObjectFull): ApiPlaybackHistoryObject {
    return new ApiPlaybackHistoryObject(parseInt(p.added_at, 10),
      ApiTrack.fromSpotifyTrack(p.track), p.context.contextType,
      ApiAudioFeatures.fromSpotifyAudioFeatures(p.audioFeatures));
  }
}
