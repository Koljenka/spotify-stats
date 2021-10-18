import {Injectable} from '@angular/core';
import {UnleashClient} from 'unleash-proxy-client';

@Injectable({
  providedIn: 'root'
})
export class UnleashService {

  private unleash = new UnleashClient({
    url: 'https://kolkie.de/unleash-spotify/proxy',
    clientKey: '63e0be75511660d3e114',
    appName: 'spotify-stats',
  });

  private isStarted = false;

  constructor() {
    this.unleash.start().then(() => this.isStarted = true);
  }

  isEnabled(toggleName: string): boolean {
    return this.unleash.isEnabled(toggleName);
  }

  isEnabledAsync(toggleName: string): Promise<boolean> {
    if (!this.getIsStarted()) {
      return this.unleash.start().then(() => Promise.resolve(this.isEnabled(toggleName)));
    }
    return Promise.resolve(this.isEnabled(toggleName));
  }

  getIsStarted(): boolean {
    return this.isStarted;
  }
}
