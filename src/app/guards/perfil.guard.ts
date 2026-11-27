import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

import { AuthService, TOKEN_STORAGE_KEY } from '../services/Auth.service';
import { UsuarioService } from '../services/Usuario.service';

/**
 * Rota `/perfil`: sem login vai para `/login`; com login busca `/me` e redireciona
 * para `/u/<username>`. Sessão inválida (401) volta ao login; outra falha cai no feed.
 */
export const perfilRedirectGuard: CanActivateFn = (): Observable<UrlTree> | UrlTree => {
  const router = inject(Router);
  const usuarioService = inject(UsuarioService);
  const authService = inject(AuthService);

  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    token = null;
  }
  if (!token) {
    return router.parseUrl('/login');
  }

  return usuarioService.meuPerfil().pipe(
    map((perfil) => router.createUrlTree(['/u', perfil.username])),
    catchError((erro: HttpErrorResponse) => {
      if (erro?.status === 401) {
        // Token inválido/expirado: limpa para não ficar "logado" no painel. O logout só
        // remove o token (não navega); o redirecionamento é o UrlTree devolvido aqui.
        authService.logout();
        return of(router.parseUrl('/login'));
      }
      return of(router.parseUrl('/feed'));
    }),
  );
};
