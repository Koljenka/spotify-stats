import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Option} from './option.model';

@Injectable()
export class StyleManagerService {

  private themeSource = new BehaviorSubject({} as Option);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  currentTheme = this.themeSource.asObservable();

  constructor() {
  }

  /**
   * Set the stylesheet with the specified key.
   */
  setStyle(theme: Option): void {
    getLinkElementForKey('theme')
      .setAttribute('href', `https://unpkg.com/@angular/material/prebuilt-themes/${theme.value}.css`);
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
    const currentTheme = this.themeSource.value.value;
    return currentTheme === 'pink-bluegrey.css' || currentTheme === 'purple-green.css';
  }
}

const getLinkElementForKey = (key: string): Element | HTMLLinkElement | null =>
  getExistingLinkElementByKey(key) || createLinkElementWithKey(key);

const getExistingLinkElementByKey = (key: string): Element | null =>
  document.head.querySelector(`link[rel="stylesheet"].${getClassNameForKey(key)}`);


const createLinkElementWithKey = (key: string): HTMLLinkElement => {
  const linkEl = document.createElement('link');
  linkEl.setAttribute('rel', 'stylesheet');
  linkEl.classList.add(getClassNameForKey(key));
  document.head.appendChild(linkEl);
  return linkEl;
};

const setThemeColorMetaValue = (color: string): void => {
  const metaEl = document.head.querySelector(`meta[name="theme-color"]`);
  metaEl.setAttribute('content', color);
};

const getClassNameForKey = (key: string): string => `app-${key}`;
