import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/auth';

  login(identificador: string, senha: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { identificador, senha })
      .pipe(tap((res) => localStorage.setItem('tuxtalk_token', res.token)));
  }

  redirecionarParaGithub(): void {
    window.location.href = `${this.apiUrl}/github`;
  }
}
