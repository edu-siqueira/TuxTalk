import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Post } from '../models/Post';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/posts';

  listar(categoriaSlug?: string): Observable<Post[]> {
    const params = categoriaSlug ? new HttpParams().set('categoria', categoriaSlug) : undefined;
    return this.http.get<Post[]>(this.apiUrl, { params });
  }

  // Backend trata como toggle: se já votou, remove o voto (unlike); senão, cria.
  // Devolve o post atualizado para o componente sincronizar score e votadoPeloUsuario
  // sem precisar recarregar a lista inteira.
  alternarUpvote(postId: number): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/${postId}/upvote`, {});
  }
}
