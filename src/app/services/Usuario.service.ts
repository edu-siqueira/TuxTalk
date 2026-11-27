import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Post } from '../models/Post';
import { AtualizarPerfilPayload, PerfilUsuario } from '../models/Usuario';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/usuarios';

  buscarPerfil(username: string): Observable<PerfilUsuario> {
    return this.http.get<PerfilUsuario>(`${this.apiUrl}/${encodeURIComponent(username)}`);
  }

  listarPosts(username: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/${encodeURIComponent(username)}/posts`);
  }

  /** Perfil de quem está logado (exige JWT; sem ele o back responde 401). */
  meuPerfil(): Observable<PerfilUsuario> {
    return this.http.get<PerfilUsuario>(`${this.apiUrl}/me`);
  }

  atualizarMeuPerfil(payload: AtualizarPerfilPayload): Observable<PerfilUsuario> {
    return this.http.put<PerfilUsuario>(`${this.apiUrl}/me`, payload);
  }
}
