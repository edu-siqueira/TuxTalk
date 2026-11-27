import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { Observable, isObservable } from 'rxjs';

import { perfilRedirectGuard } from './perfil.guard';
import { TOKEN_STORAGE_KEY } from '../services/Auth.service';

describe('perfilRedirectGuard', () => {
  let http: HttpTestingController;
  let router: Router;

  const executar = () =>
    TestBed.runInInjectionContext(() => perfilRedirectGuard({} as never, {} as never)) as
      | UrlTree
      | Observable<UrlTree>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('sem token redireciona para /login sem chamar a API', () => {
    const resultado = executar() as UrlTree;
    expect(router.serializeUrl(resultado)).toBe('/login');
  });

  it('com token busca /me e redireciona para /u/<username>', () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'token-falso');
    const resultado = executar();
    expect(isObservable(resultado)).toBe(true);

    let destino = '';
    (resultado as Observable<UrlTree>).subscribe((url) => (destino = router.serializeUrl(url)));
    http.expectOne('/api/usuarios/me').flush({ username: 'tux' });

    expect(destino).toBe('/u/tux');
  });

  it('401 em /me leva ao /login', () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'token-velho');
    let destino = '';
    (executar() as Observable<UrlTree>).subscribe((url) => (destino = router.serializeUrl(url)));
    http.expectOne('/api/usuarios/me').flush({ mensagem: 'x' }, { status: 401, statusText: 'Unauthorized' });

    expect(destino).toBe('/login');
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('outra falha em /me leva ao /feed e mantém o token', () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'token');
    let destino = '';
    (executar() as Observable<UrlTree>).subscribe((url) => (destino = router.serializeUrl(url)));
    http.expectOne('/api/usuarios/me').flush({}, { status: 500, statusText: 'Erro' });

    expect(destino).toBe('/feed');
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('token');
  });
});
