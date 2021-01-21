import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Option} from './option.model';
import {environment} from '../environments/environment';

@Injectable()
export class StyleManagerService {
  constructor() {
  }

  private themeSource = new BehaviorSubject({} as Option);
  currentTheme = this.themeSource.asObservable();

  /**
   * Set the stylesheet with the specified key.
   */
  setStyle(theme: Option): void {
    getLinkElementForKey('theme')
      .setAttribute('href', `${environment.APP_SETTINGS.assetsBasePath}${theme.value}.css`);
    setThemeColorMetaValue(theme.headingColor);
    this.themeSource.next(theme);
  }

  /**
   * Remove the stylesheet with the specified key.
   */
  removeStyle(key: string): void {
    const existingLinkElement = getExistingLinkElementByKey(key);
    if (existingLinkElement) {
      document.head.removeChild(existingLinkElement);
    }
  }

  isDarkStyleActive(): boolean {
    const currentTheme = getLinkElementForKey('theme').getAttribute('href').match(/(?<=assets\/).*/)[0];
    return currentTheme === 'pink-bluegrey.css' || currentTheme === 'purple-green.css';
  }
}

function getLinkElementForKey(key: string): Element | HTMLLinkElement | null {
  return getExistingLinkElementByKey(key) || createLinkElementWithKey(key);
}

function getExistingLinkElementByKey(key: string): Element | null {
  return document.head.querySelector(
    `link[rel="stylesheet"].${getClassNameForKey(key)}`
  );
}


function createLinkElementWithKey(key: string): HTMLLinkElement {
  const linkEl = document.createElement('link');
  linkEl.setAttribute('rel', 'stylesheet');
  linkEl.classList.add(getClassNameForKey(key));
  document.head.appendChild(linkEl);
  return linkEl;
}

function setThemeColorMetaValue(color: string): void {
  const metaEl = document.head.querySelector(`meta[name="theme-color"]`);
  metaEl.setAttribute('content', color);
}

function getClassNameForKey(key: string): string {
  return `app-${key}`;
}
