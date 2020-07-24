export class TokenService {
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
}
