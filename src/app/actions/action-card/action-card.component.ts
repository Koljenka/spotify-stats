import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {StorageService} from '../../storage.service';
import {ApiConnectionService} from '../../api-connection.service';
import {Base64} from 'js-base64';

@Component({
  selector: 'app-action-card',
  templateUrl: './action-card.component.html',
  styleUrls: ['./action-card.component.css']
})
export class ActionCardComponent implements OnInit {

  private base64Img;

  constructor(private http: HttpClient, private api: ApiConnectionService) {
  }

  ngOnInit(): void {

    this.http.get(environment.APP_SETTINGS.assetsBasePath + 'monthly-top.jpg', {responseType: 'blob'})
      .subscribe(data => {
        reader.onload = (event) => {
          this.base64Img = event.target.result;
        };
        // @ts-ignore
        reader.readAsDataURL(data);
      });

    const reader = new FileReader();
  }

  onCreate(): void {
        this.http.post(environment.APP_SETTINGS.playbackApiBasePath + '/getTopTracksForEachMonth', {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          access_token: StorageService.accessToken
        }).subscribe(value => {
            // @ts-ignore
            const trackIds: string[] = [...new Set(value.map(t => 'spotify:track:' + t.trackId))];
            this.api.getApi().createPlaylist(this.api.userId, {
              name: 'Monthly Top Songs',
              public: false,
              description: 'All your top songs from each month in one place'
            }).then(res => {
              this.api.getApi().addTracksToPlaylist(res.id, trackIds);
              this.api.getApi().uploadCustomPlaylistCoverImage(res.id, this.base64Img)
                .then(r => console.log(r))
                .catch(e => console.log(e));
            });
          }
        );
  }

}
