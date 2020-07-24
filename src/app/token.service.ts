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
}
