export class StorageService {
  private constructor() {
  }

  static get accessToken(): string {
    return localStorage.getItem('accessToken');
  }

  static set accessToken(value) {
    localStorage.setItem('accessToken', value);
  }

  static get refreshToken(): string {
    return localStorage.getItem('refreshToken');
  }

  static set refreshToken(value) {
    localStorage.setItem('refreshToken', value);
  }

  static get expiresAt(): number {
    return parseInt(localStorage.getItem('expiresAt'), 10);
  }

  static set expiresAt(value) {
    localStorage.setItem('expiresAt', String(value));
  }

  static get redirect(): string {
    return localStorage.getItem('redirect');
  }

  static set redirect(value) {
    if (value === null || value === undefined) {
      localStorage.removeItem('redirect');
    } else {
      localStorage.setItem('redirect', value);
    }
  }

  static get theme(): string {
    return (localStorage.getItem('theme') === null) ? 'indigo-pink' : localStorage.getItem('theme');
  }

  static set theme(value) {
    localStorage.setItem('theme', value);
  }
}
