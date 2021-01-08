import {Injectable} from '@angular/core';

@Injectable()
export class StyleManagerService {
  constructor() {
  }

  /**
   * Set the stylesheet with the specified key.
   */
  setStyle(href: string): void {
    getLinkElementForKey('theme').setAttribute('href', href);
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

function getClassNameForKey(key: string): string {
  return `app-${key}`;
}
