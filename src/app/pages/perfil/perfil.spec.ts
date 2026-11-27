import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { PerfilComponent } from './perfil';
import { PerfilUsuario } from '../../models/Usuario';
import { Post } from '../../models/Post';

const perfilBase: PerfilUsuario = {
  username: 'tux',
  criadoEm: '2026-03-15T12:00:00Z',
  bio: 'Uso Arch, btw.',
  avatarUrl: null,
  totalPosts: 1,
  totalUpvotesRecebidos: 7,
  email: null,
  proprio: false,
};

const postBase: Post = {
  id: 1,
  titulo: 'Arch ou Debian?',
  resumo: 'Resumo',
  categoria: 'distros',
  autor: 'tux',
  criadoEm: '2026-01-01T00:00:00Z',
  score: 3,
  totalComentarios: 0,
  votadoPeloUsuario: false,
};

describe('PerfilComponent', () => {
  let fixture: ComponentFixture<PerfilComponent>;
  let http: HttpTestingController;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const raiz = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const seletor = <T extends HTMLElement = HTMLElement>(css: string): T | null => raiz().querySelector<T>(css);
  const texto = (): string => raiz().textContent ?? '';

  const responder = (username: string, perfil: PerfilUsuario | null, posts: Post[] = []): void => {
    const reqPerfil = http.expectOne(`/api/usuarios/${username}`);
    // Pode sobrar uma requisição cancelada de uma tentativa anterior: vale a última.
    const reqPosts = http.match(`/api/usuarios/${username}/posts`).filter((r) => !r.cancelled).pop()!;
    if (perfil) {
      reqPerfil.flush(perfil);
      reqPosts.flush(posts);
    } else {
      // forkJoin cancela a segunda requisição quando a primeira falha.
      reqPerfil.flush({ mensagem: 'Usuário não encontrado' }, { status: 404, statusText: 'Not Found' });
    }
    fixture.detectChanges();
  };

  beforeEach(async () => {
    localStorage.clear();
    params = new BehaviorSubject(convertToParamMap({ username: 'tux' }));
    await TestBed.configureTestingModule({
      imports: [PerfilComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: params.asObservable(),
            get snapshot() {
              return { paramMap: params.value };
            },
          },
        },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PerfilComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('mostra o carregando enquanto as requisições não voltam', () => {
    expect(seletor('[role="status"]')).toBeTruthy();
    expect(texto()).toContain('Carregando perfil');
    responder('tux', perfilBase);
  });

  it('mostra dados do perfil, totais, data em pt-BR e os posts', () => {
    responder('tux', perfilBase, [postBase]);

    expect(seletor('h1')?.textContent).toContain('tux');
    expect(texto()).toContain('15 de março de 2026');
    expect(texto()).toContain('Uso Arch, btw.');
    expect(seletor('.perfil-totais')?.textContent).toContain('7');
    expect(texto()).toContain('Arch ou Debian?');
    expect(seletor('.perfil-avatar-inicial')?.textContent?.trim()).toBe('T');
    expect(seletor('app-post-card a.post-autor')?.getAttribute('href')).toBe('/u/tux');
  });

  it('atualiza o título da aba', () => {
    responder('tux', perfilBase);
    expect(TestBed.inject(Title).getTitle()).toBe('@tux · TuxTalk');
  });

  it('mostra o estado vazio quando não há posts', () => {
    responder('tux', perfilBase, []);
    expect(texto()).toContain('Nenhum post por aqui ainda');
  });

  it('usa a imagem do avatar e cai para a inicial se ela falhar', () => {
    responder('tux', { ...perfilBase, avatarUrl: 'https://exemplo.com/a.png' });

    const img = seletor<HTMLImageElement>('.perfil-avatar img');
    expect(img?.getAttribute('src')).toBe('https://exemplo.com/a.png');

    img?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(seletor('.perfil-avatar img')).toBeNull();
    expect(seletor('.perfil-avatar-inicial')?.textContent?.trim()).toBe('T');
  });

  it('mostra "usuário não encontrado" no 404', () => {
    responder('tux', null);
    expect(texto()).toContain('Usuário não encontrado');
    expect(seletor('.perfil-janela')).toBeNull();
  });

  it('mostra erro genérico e permite tentar de novo', () => {
    http.expectOne('/api/usuarios/tux').flush({}, { status: 500, statusText: 'Erro' });
    fixture.detectChanges();

    expect(texto()).toContain('Não foi possível carregar o perfil');

    seletor<HTMLButtonElement>('.perfil-botao')?.click();
    responder('tux', perfilBase);

    expect(seletor('h1')?.textContent).toContain('tux');
  });

  it('título da aba: 404 e erro genérico não ficam com @username', () => {
    const titulo = TestBed.inject(Title);
    responder('tux', null);
    expect(titulo.getTitle()).toBe('Usuário não encontrado · TuxTalk');

    params.next(convertToParamMap({ username: 'ana' }));
    fixture.detectChanges();
    http.expectOne('/api/usuarios/ana').flush({}, { status: 500, statusText: 'Erro' });
    http.match('/api/usuarios/ana/posts'); // cancelada pelo forkJoin
    expect(titulo.getTitle()).toBe('TuxTalk');
  });

  it('tentar de novo cancelado ao trocar :username: a resposta antiga não altera o estado', () => {
    http.expectOne('/api/usuarios/tux').flush({}, { status: 500, statusText: 'Erro' });
    fixture.detectChanges();

    seletor<HTMLButtonElement>('.perfil-botao')?.click();
    const antigas = [
      ...http.match('/api/usuarios/tux'),
      ...http.match('/api/usuarios/tux/posts'),
    ].filter((r) => !r.cancelled);
    expect(antigas.length).toBe(2);

    params.next(convertToParamMap({ username: 'ana' }));
    fixture.detectChanges();
    expect(antigas.every((r) => r.cancelled)).toBe(true);

    responder('ana', { ...perfilBase, username: 'ana' });
    expect(seletor('h1')?.textContent).toContain('ana');
    expect(TestBed.inject(Title).getTitle()).toBe('@ana · TuxTalk');
  });

  it('trocar :username durante o PUT cancela o salvamento e reinicia a edição', () => {
    const proprio: PerfilUsuario = { ...perfilBase, proprio: true };
    responder('tux', proprio);
    seletor<HTMLButtonElement>('.perfil-info .perfil-botao')?.click();
    fixture.detectChanges();
    const c = fixture.componentInstance;
    c.form.setValue({ bio: 'x', avatarUrl: '' });
    c.salvar();
    const put = http.expectOne('/api/usuarios/me');
    expect(c.salvando()).toBe(true);

    params.next(convertToParamMap({ username: 'ana' }));
    fixture.detectChanges();

    expect(put.cancelled).toBe(true);
    expect(c.salvando()).toBe(false);
    expect(c.editando()).toBe(false);
    responder('ana', { ...perfilBase, username: 'ana' });
    expect(seletor('.perfil-form')).toBeNull();
  });

  it('recarrega ao trocar :username na mesma instância', () => {
    responder('tux', perfilBase);

    params.next(convertToParamMap({ username: 'ana' }));
    fixture.detectChanges();
    responder('ana', { ...perfilBase, username: 'ana', bio: 'Oi' });

    expect(seletor('h1')?.textContent).toContain('ana');
    expect(TestBed.inject(Title).getTitle()).toBe('@ana · TuxTalk');
  });

  describe('perfil próprio', () => {
    const proprio: PerfilUsuario = { ...perfilBase, proprio: true, email: 'tux@exemplo.com' };

    it('não mostra email nem editar quando não é o próprio', () => {
      responder('tux', perfilBase);
      expect(texto()).not.toContain('Editar perfil');
      expect(seletor('.perfil-email')).toBeNull();
    });

    it('mostra email e o botão Editar perfil', () => {
      responder('tux', proprio);
      expect(seletor('.perfil-email')?.textContent).toContain('tux@exemplo.com');
      expect(texto()).toContain('Editar perfil');
    });

    const abrirForm = (): void => {
      responder('tux', proprio);
      seletor<HTMLButtonElement>('.perfil-info .perfil-botao')?.click();
      fixture.detectChanges();
    };

    it('abre o form preenchido com contador e fecha ao cancelar', () => {
      abrirForm();

      expect(seletor<HTMLTextAreaElement>('#perfil-bio')?.value).toBe('Uso Arch, btw.');
      expect(seletor('.perfil-contador')?.textContent?.trim()).toBe('14/280');

      const cancelar = Array.from(raiz().querySelectorAll<HTMLButtonElement>('.perfil-form-acoes button')).find(
        (b) => b.textContent?.includes('Cancelar'),
      );
      cancelar?.click();
      fixture.detectChanges();

      expect(seletor('.perfil-form')).toBeNull();
    });

    it('valida bio acima de 280 e URL fora do padrão http(s)', () => {
      abrirForm();
      const c = fixture.componentInstance;

      c.form.controls.bio.setValue('x'.repeat(281));
      c.form.controls.avatarUrl.setValue('ftp://x.com/a.png');
      fixture.detectChanges();

      expect(c.form.invalid).toBe(true);
      expect(c.form.controls.bio.hasError('maxlength')).toBe(true);
      expect(c.form.controls.avatarUrl.hasError('pattern')).toBe(true);
      expect(seletor<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);

      c.form.controls.bio.setValue('ok');
      c.form.controls.avatarUrl.setValue('https://x.com/a.png');
      expect(c.form.valid).toBe(true);

      c.form.controls.avatarUrl.setValue('https://' + 'a'.repeat(500));
      expect(c.form.controls.avatarUrl.hasError('maxlength')).toBe(true);
    });

    it('aceita HTTPS em maiúsculas e espaços nas pontas, enviando o valor com trim', () => {
      abrirForm();
      const c = fixture.componentInstance;
      c.form.setValue({ bio: 'ok', avatarUrl: ' HTTPS://x.com/a.png ' });
      expect(c.form.controls.avatarUrl.valid).toBe(true);

      c.salvar();
      const req = http.expectOne('/api/usuarios/me');
      expect(req.request.body).toEqual({ bio: 'ok', avatarUrl: 'HTTPS://x.com/a.png' });
      req.flush({ ...proprio, avatarUrl: 'HTTPS://x.com/a.png' });
    });

    it('salva com PUT e atualiza a página com a resposta', () => {
      abrirForm();
      const c = fixture.componentInstance;
      c.form.setValue({ bio: 'Nova bio', avatarUrl: 'https://x.com/a.png' });

      c.salvar();
      const req = http.expectOne('/api/usuarios/me');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ bio: 'Nova bio', avatarUrl: 'https://x.com/a.png' });
      req.flush({ ...proprio, bio: 'Nova bio', avatarUrl: 'https://x.com/a.png' });
      fixture.detectChanges();

      expect(seletor('.perfil-form')).toBeNull();
      expect(texto()).toContain('Nova bio');
      expect(seletor('.perfil-avatar img')?.getAttribute('src')).toBe('https://x.com/a.png');
    });

    it('envia null quando os campos ficam vazios', () => {
      abrirForm();
      const c = fixture.componentInstance;
      c.form.setValue({ bio: '', avatarUrl: '' });

      c.salvar();
      const req = http.expectOne('/api/usuarios/me');
      expect(req.request.body).toEqual({ bio: null, avatarUrl: null });
      req.flush({ ...proprio, bio: null });
    });

    it('mostra a mensagem do back em caso de 400 e mantém o form aberto', () => {
      abrirForm();
      const c = fixture.componentInstance;
      c.form.setValue({ bio: 'ok', avatarUrl: 'https://x.com/a.png' });

      c.salvar();
      http
        .expectOne('/api/usuarios/me')
        .flush({ mensagem: 'avatarUrl inválida' }, { status: 400, statusText: 'Bad Request' });
      fixture.detectChanges();

      expect(seletor('.perfil-form')).toBeTruthy();
      expect(seletor('.perfil-erro-salvar')?.textContent).toContain('avatarUrl inválida');
    });

    it('mostra cada mensagem de `campos` junto do campo no 400', () => {
      abrirForm();
      const c = fixture.componentInstance;
      c.form.setValue({ bio: 'ok', avatarUrl: 'https://x.com/a.png' });

      c.salvar();
      http.expectOne('/api/usuarios/me').flush(
        { mensagem: 'Dados inválidos', campos: { bio: 'Bio longa demais', avatarUrl: 'URL inválida' } },
        { status: 400, statusText: 'Bad Request' },
      );
      fixture.detectChanges();

      expect(seletor('.perfil-erro-bio')?.textContent).toContain('Bio longa demais');
      expect(seletor('.perfil-erro-avatar')?.textContent).toContain('URL inválida');
      expect(seletor('.perfil-erro-salvar')).toBeNull();
    });
  });
});
