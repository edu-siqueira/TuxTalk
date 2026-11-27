import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { UsuarioService } from './Usuario.service';
import { PerfilUsuario } from '../models/Usuario';

const perfil: PerfilUsuario = {
  username: 'tux',
  criadoEm: '2026-01-01T00:00:00Z',
  bio: null,
  avatarUrl: null,
  totalPosts: 2,
  totalUpvotesRecebidos: 5,
  email: null,
  proprio: false,
};

describe('UsuarioService', () => {
  let service: UsuarioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsuarioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('buscarPerfil faz GET em /api/usuarios/{username}', () => {
    let resultado: PerfilUsuario | undefined;
    service.buscarPerfil('tux').subscribe((p) => (resultado = p));

    const req = http.expectOne('/api/usuarios/tux');
    expect(req.request.method).toBe('GET');
    req.flush(perfil);

    expect(resultado).toEqual(perfil);
  });

  it('buscarPerfil codifica o username na URL', () => {
    service.buscarPerfil('a b/c').subscribe();
    http.expectOne('/api/usuarios/a%20b%2Fc').flush(perfil);
  });

  it('listarPosts faz GET em /api/usuarios/{username}/posts', () => {
    let resultado: unknown;
    service.listarPosts('tux').subscribe((p) => (resultado = p));

    const req = http.expectOne('/api/usuarios/tux/posts');
    expect(req.request.method).toBe('GET');
    req.flush([]);

    expect(resultado).toEqual([]);
  });

  it('meuPerfil faz GET em /api/usuarios/me', () => {
    service.meuPerfil().subscribe();

    const req = http.expectOne('/api/usuarios/me');
    expect(req.request.method).toBe('GET');
    req.flush(perfil);
  });

  it('atualizarMeuPerfil faz PUT em /api/usuarios/me com o corpo', () => {
    let resultado: PerfilUsuario | undefined;
    service.atualizarMeuPerfil({ bio: 'oi', avatarUrl: null }).subscribe((p) => (resultado = p));

    const req = http.expectOne('/api/usuarios/me');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ bio: 'oi', avatarUrl: null });
    req.flush({ ...perfil, bio: 'oi' });

    expect(resultado?.bio).toBe('oi');
  });
});
