import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { By, Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';

import { FeedComponent, SIDEBAR_RECOLHIDA_STORAGE_KEY, lerNomeDoToken } from './feed';
import { PainelComponent } from '../../components/painel/painel';
import { AuthService, TOKEN_STORAGE_KEY } from '../../services/Auth.service';
import { Post } from '../../models/Post';

describe('FeedComponent', () => {
  let component: FeedComponent;
  let fixture: ComponentFixture<FeedComponent>;
  let http: HttpTestingController;

  const textoDoFeed = (): string => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const seletor = (css: string): HTMLElement | null =>
    (fixture.nativeElement as HTMLElement).querySelector(css);

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [FeedComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // dispara ngOnInit e a requisição
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    http.expectOne('/api/posts').flush([]);
  });

  it('mostra o carregando durante a requisição e esconde o estado vazio', () => {
    const carregando = seletor('.estado-carregando');
    expect(carregando).toBeTruthy();
    expect(carregando?.getAttribute('role')).toBe('status');
    expect(textoDoFeed()).toContain('Carregando posts');
    expect(seletor('.estado-vazio')).toBeNull();
    expect(seletor('.estado-erro')).toBeNull();

    http.expectOne('/api/posts').flush([]);
  });

  it('mostra o estado vazio só depois de uma resposta vazia', () => {
    http.expectOne('/api/posts').flush([]);
    fixture.detectChanges();

    expect(seletor('.estado-carregando')).toBeNull();
    expect(seletor('.estado-erro')).toBeNull();
    expect(seletor('.estado-vazio')).toBeTruthy();
  });

  it('não mostra o estado vazio quando há posts', () => {
    const post: Post = {
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
    http.expectOne('/api/posts').flush([post]);
    fixture.detectChanges();

    expect(seletor('.estado-vazio')).toBeNull();
    expect(textoDoFeed()).toContain('Arch ou Debian?');
  });

  it('mostra o erro com role="alert" quando a requisição falha, sem o estado vazio', () => {
    http.expectOne('/api/posts').flush('falha', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    const erro = seletor('.estado-erro');
    expect(erro).toBeTruthy();
    expect(erro?.getAttribute('role')).toBe('alert');
    expect(seletor('.estado-carregando')).toBeNull();
    expect(seletor('.estado-vazio')).toBeNull();
  });

  it('"Tentar de novo" refaz a requisição e limpa o erro', () => {
    http.expectOne('/api/posts').flush('falha', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    seletor('.tentar-de-novo')?.click();
    fixture.detectChanges();

    expect(seletor('.estado-erro')).toBeNull();
    expect(seletor('.estado-carregando')).toBeTruthy();

    http.expectOne('/api/posts').flush([]);
    fixture.detectChanges();

    expect(seletor('.estado-vazio')).toBeTruthy();
  });

  describe('painel', () => {
    it('renderiza o painel e o evento sair chama o logout', () => {
      http.expectOne('/api/posts').flush([]);
      fixture.detectChanges();

      expect(seletor('app-painel')).toBeTruthy();

      const authService = TestBed.inject(AuthService);
      const router = TestBed.inject(Router);
      const logout = vi.spyOn(authService, 'logout');
      const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      const painel = fixture.debugElement.query(By.directive(PainelComponent));
      (painel.componentInstance as PainelComponent).sair.emit();

      expect(logout).toHaveBeenCalled();
      expect(navegar).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('sidebar de categorias', () => {
    const itens = (): HTMLButtonElement[] =>
      Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.categoria-item'));

    beforeEach(() => {
      http.expectOne('/api/posts').flush([]);
      fixture.detectChanges();
    });

    it('lista as categorias com "Todos" ativo no início', () => {
      expect(itens().map((i) => i.textContent?.trim())).toEqual([
        'Todos',
        'Distros',
        'Dotfiles',
        'Tiling-wms',
        'Troubleshooting',
      ]);
      const ativos = itens().filter((i) => i.getAttribute('aria-pressed') === 'true');
      expect(ativos.length).toBe(1);
      expect(ativos[0].textContent).toContain('Todos');
      expect(ativos[0].classList.contains('ativo')).toBe(true);
    });

    it('clicar em uma categoria filtra, marca o item ativo e atualiza o título', () => {
      itens()[1].click();
      fixture.detectChanges();

      http.expectOne('/api/posts?categoria=distros').flush([]);
      fixture.detectChanges();

      const ativos = itens().filter((i) => i.getAttribute('aria-pressed') === 'true');
      expect(ativos.length).toBe(1);
      expect(ativos[0].textContent).toContain('Distros');
      expect(seletor('.feed-categoria-ativa')?.textContent).toContain('Distros');
    });

    it('clicar na categoria já ativa não refaz a requisição', () => {
      itens()[0].click();
      http.expectNone('/api/posts');
    });
  });

  it('limpa a lista antiga quando a troca de categoria falha', () => {
    const post: Post = {
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
    http.expectOne('/api/posts').flush([post]);
    fixture.detectChanges();
    expect(seletor('app-post-card')).toBeTruthy();

    component.selecionarCategoria('dotfiles');
    http
      .expectOne('/api/posts?categoria=dotfiles')
      .flush('falha', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.posts()).toEqual([]);
    expect(seletor('app-post-card')).toBeNull();
    expect(seletor('.estado-erro')).toBeTruthy();
    expect(textoDoFeed()).not.toContain('Arch ou Debian?');
  });

  it('esconde a lista antiga enquanto carrega outra categoria', () => {
    const post: Post = {
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
    http.expectOne('/api/posts').flush([post]);
    fixture.detectChanges();

    component.selecionarCategoria('dotfiles');
    fixture.detectChanges();

    expect(seletor('.estado-carregando')).toBeTruthy();
    expect(seletor('app-post-card')).toBeNull();

    http.expectOne('/api/posts?categoria=dotfiles').flush([]);
  });
});

describe('FeedComponent - sidebar colapsável', () => {
  let fixture: ComponentFixture<FeedComponent>;
  let http: HttpTestingController;
  let matchMediaOriginal: PropertyDescriptor | undefined;

  const raiz = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const q = (css: string): HTMLElement | null => raiz().querySelector(css);
  const itens = (): HTMLButtonElement[] =>
    Array.from(raiz().querySelectorAll<HTMLButtonElement>('.categoria-item'));
  const botaoAlternar = (): HTMLButtonElement =>
    q('.feed-sidebar-topo .sidebar-botao') as HTMLButtonElement;
  const botaoGaveta = (): HTMLButtonElement => q('.categorias-botao-mobile') as HTMLButtonElement;

  let aoMudarBreakpoint: ((e: { matches: boolean }) => void) | undefined;
  let aoMudarToque: ((e: { matches: boolean }) => void) | undefined;

  // Responde por consulta: "(pointer: coarse)" é o ponteiro de toque; o resto é o breakpoint mobile.
  function simularMatchMedia(mobile: boolean, toque = false): void {
    aoMudarBreakpoint = undefined;
    aoMudarToque = undefined;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (consulta: string) => {
        const ehToque = consulta.includes('pointer');
        return {
          matches: ehToque ? toque : mobile,
          addEventListener: (_tipo: string, fn: (e: { matches: boolean }) => void) => {
            if (ehToque) {
              aoMudarToque = fn;
            } else {
              aoMudarBreakpoint = fn;
            }
          },
          removeEventListener: () => undefined,
        };
      },
    });
  }

  async function criar(mobile = false, toque = false): Promise<void> {
    simularMatchMedia(mobile, toque);
    await TestBed.configureTestingModule({
      imports: [FeedComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FeedComponent);
    fixture.detectChanges();
    http.expectOne('/api/posts').flush([]);
    fixture.detectChanges();
  }

  beforeEach(() => {
    localStorage.clear();
    matchMediaOriginal = Object.getOwnPropertyDescriptor(window, 'matchMedia');
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    vi.restoreAllMocks();
    if (matchMediaOriginal) {
      Object.defineProperty(window, 'matchMedia', matchMediaOriginal);
    } else {
      delete (window as unknown as Record<string, unknown>)['matchMedia'];
    }
  });

  describe('desktop', () => {
    it('começa expandida e alterna aria-expanded, rótulo e persistência', async () => {
      await criar();
      expect(botaoAlternar().getAttribute('aria-expanded')).toBe('true');
      expect(botaoAlternar().getAttribute('aria-label')).toBe('Recolher categorias');
      expect(botaoAlternar().getAttribute('aria-controls')).toBe('categoria-lista');
      expect(q('#categoria-lista')).toBeTruthy();
      expect(q('.feed-sidebar')?.classList.contains('recolhida')).toBe(false);

      botaoAlternar().click();
      fixture.detectChanges();

      expect(botaoAlternar().getAttribute('aria-expanded')).toBe('false');
      expect(botaoAlternar().getAttribute('aria-label')).toBe('Expandir categorias');
      expect(q('.pi-angle-double-right')).toBeTruthy();
      expect(q('.feed-sidebar')?.classList.contains('recolhida')).toBe(true);
      expect(localStorage.getItem(SIDEBAR_RECOLHIDA_STORAGE_KEY)).toBe('true');
      // rótulo continua no DOM e o item ganha tooltip
      expect(itens()[1].querySelector('.categoria-rotulo')?.textContent).toContain('Distros');
      expect(itens()[1].getAttribute('title')).toBe('Distros');

      botaoAlternar().click();
      fixture.detectChanges();
      expect(botaoAlternar().getAttribute('aria-expanded')).toBe('true');
      expect(q('.pi-angle-double-left')).toBeTruthy();
      expect(localStorage.getItem(SIDEBAR_RECOLHIDA_STORAGE_KEY)).toBe('false');
      expect(itens()[1].getAttribute('title')).toBeNull();
    });

    it('restaura o estado recolhido ao recriar o componente', async () => {
      localStorage.setItem(SIDEBAR_RECOLHIDA_STORAGE_KEY, 'true');
      await criar();
      expect(botaoAlternar().getAttribute('aria-expanded')).toBe('false');
      expect(q('.feed-page')?.classList.contains('sidebar-recolhida')).toBe(true);
    });

    it('em tela de toque (tablet) o menu fica sempre expandido, mesmo com o trilho salvo', async () => {
      localStorage.setItem(SIDEBAR_RECOLHIDA_STORAGE_KEY, 'true');
      await criar(false, true);

      expect(fixture.componentInstance.toque()).toBe(true);
      expect(fixture.componentInstance.trilho()).toBe(false);
      expect(q('.feed-sidebar')?.classList.contains('recolhida')).toBe(false);
      expect(q('.feed-page')?.classList.contains('sidebar-recolhida')).toBe(false);
      // sem trilho não há botão de recolher, e os rótulos aparecem sem depender de tooltip
      expect(q('.feed-sidebar-topo .sidebar-botao')).toBeNull();
      expect(itens()[1].getAttribute('title')).toBeNull();
    });

    it('acompanha a troca do ponteiro (mouse <-> toque) sem apagar a preferência salva', async () => {
      localStorage.setItem(SIDEBAR_RECOLHIDA_STORAGE_KEY, 'true');
      await criar();
      expect(fixture.componentInstance.trilho()).toBe(true);
      expect(botaoAlternar()).toBeTruthy();

      aoMudarToque?.({ matches: true });
      fixture.detectChanges();
      expect(fixture.componentInstance.trilho()).toBe(false);
      expect(q('.feed-sidebar-topo .sidebar-botao')).toBeNull();

      aoMudarToque?.({ matches: false });
      fixture.detectChanges();
      expect(fixture.componentInstance.trilho()).toBe(true);
      expect(botaoAlternar().getAttribute('aria-expanded')).toBe('false');
      expect(localStorage.getItem(SIDEBAR_RECOLHIDA_STORAGE_KEY)).toBe('true');
    });

    it('não quebra quando o localStorage está indisponível', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('bloqueado');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('bloqueado');
      });
      await criar();
      expect(botaoAlternar().getAttribute('aria-expanded')).toBe('true');

      botaoAlternar().click();
      fixture.detectChanges();
      expect(botaoAlternar().getAttribute('aria-expanded')).toBe('false');
    });

    it('renderiza um ícone distinto por categoria', async () => {
      await criar();
      const icones = itens().map((i) => i.querySelector('.categoria-icone')?.className ?? '');
      const esperados = [
        'pi-th-large',
        'pi-desktop',
        'pi-file-edit',
        'pi-window-maximize',
        'pi-wrench',
      ];
      esperados.forEach((classe, idx) => expect(icones[idx]).toContain(classe));
      expect(icones.some((c) => c.includes('pi-folder'))).toBe(false);
    });

    it('liga as transições só depois do primeiro render', async () => {
      await criar();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(q('.feed-page')?.classList.contains('animavel')).toBe(true);
    });

    it('não anima a troca de breakpoint e religa as transições depois', async () => {
      await criar();
      await fixture.whenStable();
      expect(fixture.componentInstance.animar()).toBe(true);

      aoMudarBreakpoint?.({ matches: true });
      expect(fixture.componentInstance.animar()).toBe(false);
      expect(fixture.componentInstance.ehMobile()).toBe(true);

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(q('.feed-sidebar')?.classList.contains('gaveta')).toBe(true);
      expect(q('.feed-page')?.classList.contains('animavel')).toBe(true);
    });

    it('não mostra o backdrop nem role=dialog', async () => {
      await criar();
      expect(q('.gaveta-backdrop')).toBeNull();
      expect(q('.feed-sidebar')?.getAttribute('role')).toBeNull();
    });
  });

  describe('mobile (gaveta)', () => {
    it('abre pelo botão, foca o item ativo e expõe role=dialog', async () => {
      await criar(true);
      expect(botaoGaveta().getAttribute('aria-expanded')).toBe('false');
      expect(q('.feed-sidebar')?.classList.contains('aberta')).toBe(false);

      botaoGaveta().click();
      fixture.detectChanges();
      await fixture.whenStable();

      const aside = q('.feed-sidebar') as HTMLElement;
      expect(botaoGaveta().getAttribute('aria-expanded')).toBe('true');
      expect(aside.classList.contains('aberta')).toBe(true);
      expect(aside.getAttribute('role')).toBe('dialog');
      expect(aside.getAttribute('aria-modal')).toBe('true');
      expect(aside.getAttribute('aria-label')).toBe('Categorias');
      expect(q('.gaveta-backdrop')).toBeTruthy();
      expect(document.activeElement).toBe(itens()[0]);
    });

    it('Esc fecha e devolve o foco ao botão', async () => {
      await criar(true);
      botaoGaveta().click();
      fixture.detectChanges();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      expect(botaoGaveta().getAttribute('aria-expanded')).toBe('false');
      expect(q('.gaveta-backdrop')).toBeNull();
      expect(document.activeElement).toBe(botaoGaveta());
    });

    it('clicar no backdrop fecha', async () => {
      await criar(true);
      botaoGaveta().click();
      fixture.detectChanges();

      (q('.gaveta-backdrop') as HTMLElement).click();
      fixture.detectChanges();

      expect(q('.feed-sidebar')?.classList.contains('aberta')).toBe(false);
      expect(q('.gaveta-backdrop')).toBeNull();
    });

    it('o botão de fechar dentro da gaveta fecha', async () => {
      await criar(true);
      botaoGaveta().click();
      fixture.detectChanges();

      (q('.feed-sidebar-topo .sidebar-botao') as HTMLElement).click();
      fixture.detectChanges();

      expect(botaoGaveta().getAttribute('aria-expanded')).toBe('false');
    });

    it('escolher uma categoria filtra e fecha a gaveta', async () => {
      await criar(true);
      botaoGaveta().click();
      fixture.detectChanges();

      itens()[2].click();
      fixture.detectChanges();
      http.expectOne('/api/posts?categoria=dotfiles').flush([]);
      fixture.detectChanges();

      expect(q('.feed-sidebar')?.classList.contains('aberta')).toBe(false);
      expect(q('.feed-categoria-ativa')?.textContent).toContain('Dotfiles');
      expect(q('.categorias-botao-ativa')?.textContent).toContain('Dotfiles');
    });

    it('ignora o estado recolhido do desktop', async () => {
      localStorage.setItem(SIDEBAR_RECOLHIDA_STORAGE_KEY, 'true');
      await criar(true);
      expect(q('.feed-sidebar')?.classList.contains('recolhida')).toBe(false);
      expect(q('.feed-page')?.classList.contains('sidebar-recolhida')).toBe(false);
      expect(itens()[1].getAttribute('title')).toBeNull();
    });

    it('gaveta aberta deixa painel e conteúdo inertes e trava a rolagem', async () => {
      await criar(true);
      expect(q('app-painel')?.hasAttribute('inert')).toBe(false);

      botaoGaveta().click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(q('app-painel')?.hasAttribute('inert')).toBe(true);
      expect(q('.feed-conteudo')?.hasAttribute('inert')).toBe(true);
      expect(q('.feed-sidebar')?.hasAttribute('inert')).toBe(false);
      expect(document.documentElement.classList.contains('tux-sem-rolagem')).toBe(true);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(q('app-painel')?.hasAttribute('inert')).toBe(false);
      expect(q('.feed-conteudo')?.hasAttribute('inert')).toBe(false);
      expect(document.documentElement.classList.contains('tux-sem-rolagem')).toBe(false);
    });

    it('destruir o feed com a gaveta aberta libera a rolagem', async () => {
      await criar(true);
      botaoGaveta().click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.destroy();
      expect(document.documentElement.classList.contains('tux-sem-rolagem')).toBe(false);
    });
  });

  it('link "Pular para os posts" é o primeiro foco e leva o foco à lista', async () => {
    await criar();
    const pular = q('a.pular-conteudo') as HTMLAnchorElement;
    expect(pular).toBeTruthy();
    expect(raiz().querySelector('a, button')).toBe(pular);

    pular.click();
    expect(document.activeElement).toBe(q('#posts'));
  });

  it('o rótulo "$ categorias" não é heading (o h1 é o primeiro título da página)', async () => {
    await criar();
    expect(raiz().querySelector('h1, h2')?.tagName).toBe('H1');
  });
});

describe('FeedComponent - textos', () => {
  let fixture: ComponentFixture<FeedComponent>;
  let http: HttpTestingController;

  const q = (css: string): HTMLElement | null =>
    (fixture.nativeElement as HTMLElement).querySelector(css);
  const status = (): string =>
    (fixture.nativeElement as HTMLElement)
      .querySelector('.post-list > p.visually-hidden[role="status"]')
      ?.textContent?.trim() ?? '';

  async function criar(token: string | null = null): Promise<void> {
    localStorage.clear();
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    await TestBed.configureTestingModule({
      imports: [FeedComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FeedComponent);
    fixture.detectChanges();
  }

  beforeEach(() => {
    http = undefined as unknown as HttpTestingController;
  });

  afterEach(() => {
    http?.verify();
    localStorage.clear();
  });

  it('mostra "visitante" no prompt sem login e esconde o prompt do leitor de tela', async () => {
    await criar();
    http.expectOne('/api/posts').flush([]);
    fixture.detectChanges();

    const prompt = q('.feed-prompt');
    expect(prompt?.textContent).toContain('visitante@tuxtalk:~/feed$');
    expect(prompt?.getAttribute('aria-hidden')).toBe('true');
    expect(q('#feed-titulo')?.textContent).toContain('Posts:');
  });

  it('mostra o nome do token no prompt quando logado', async () => {
    const payload = btoa(JSON.stringify({ sub: 'linus' })).replace(/=+$/, '');
    await criar(`cabecalho.${payload}.assinatura`);
    http.expectOne('/api/posts').flush([]);
    fixture.detectChanges();

    expect(q('.feed-prompt')?.textContent).toContain('linus@tuxtalk');
  });

  it('lerNomeDoToken cai para "usuario" com token ilegível', () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'nao-e-jwt');
    expect(lerNomeDoToken()).toBe('usuario');
    localStorage.clear();
    expect(lerNomeDoToken()).toBe('visitante');
  });

  it('estado vazio numa categoria oferece ver todos os posts', async () => {
    await criar();
    http.expectOne('/api/posts').flush([]);
    fixture.detectChanges();
    expect(q('.estado-vazio')?.textContent).toContain('Ainda não há posts por aqui.');
    expect(q('.estado-vazio button')).toBeNull();

    fixture.componentInstance.selecionarCategoria('dotfiles');
    http.expectOne('/api/posts?categoria=dotfiles').flush([]);
    fixture.detectChanges();

    expect(q('.estado-vazio')?.textContent).toContain('Ainda não há posts em Dotfiles.');
    (q('.estado-vazio button') as HTMLButtonElement).click();
    http.expectOne('/api/posts').flush([]);
    fixture.detectChanges();
    expect(fixture.componentInstance.categoriaAtiva()).toBeNull();
  });

  it('anuncia o resultado do filtro', async () => {
    await criar();
    expect(status()).toBe('');
    http.expectOne('/api/posts').flush([]);
    fixture.detectChanges();
    expect(status()).toBe('Nenhum post');

    fixture.componentInstance.selecionarCategoria('distros');
    fixture.detectChanges();
    expect(status()).toBe('');
    http.expectOne('/api/posts?categoria=distros').flush([
      {
        id: 1, titulo: 'A', resumo: 'r', categoria: 'distros', autor: 'tux',
        criadoEm: '2026-01-01T00:00:00Z', score: 0, totalComentarios: 0, votadoPeloUsuario: false,
      },
    ]);
    fixture.detectChanges();
    expect(status()).toBe('1 post em Distros');
  });

  it('mensagem de erro não repete o botão', async () => {
    await criar();
    http.expectOne('/api/posts').flush('x', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(q('.estado-erro p')?.textContent?.trim()).toBe('Não foi possível carregar os posts.');
  });

  it('carregando, erro e vazio ficam em janelas com o caminho na barra de título', async () => {
    await criar();
    const titulo = (css: string): string | undefined =>
      q(`${css} .janela-titulo`)?.textContent?.trim();

    expect(titulo('.estado-carregando')).toBe('~/posts/');

    http.expectOne('/api/posts').flush([]);
    fixture.detectChanges();
    expect(titulo('.estado-vazio')).toBe('~/posts/');

    fixture.componentInstance.selecionarCategoria('dotfiles');
    http.expectOne('/api/posts?categoria=dotfiles').flush([]);
    fixture.detectChanges();
    expect(titulo('.estado-vazio')).toBe('~/dotfiles/');

    fixture.componentInstance.carregarPosts();
    http
      .expectOne('/api/posts?categoria=dotfiles')
      .flush('x', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(titulo('.estado-erro')).toBe('~/erro/');
    expect(q('.estado-erro .estado-dica')?.textContent).toContain('Tente de novo');
    expect(q('.estado-erro button')?.textContent?.trim()).toBe('Tentar de novo');
  });
});

describe('FeedComponent - upvote', () => {
  let fixture: ComponentFixture<FeedComponent>;
  let http: HttpTestingController;

  const post: Post = {
    id: 7,
    titulo: 'Arch ou Debian?',
    resumo: 'Resumo',
    categoria: 'distros',
    autor: 'tux',
    criadoEm: '2026-01-01T00:00:00Z',
    score: 3,
    totalComentarios: 0,
    votadoPeloUsuario: false,
  };

  const q = (css: string): HTMLElement | null =>
    (fixture.nativeElement as HTMLElement).querySelector(css);
  const votar = (): void => {
    (q('.upvote-btn') as HTMLButtonElement).click();
    fixture.detectChanges();
  };
  const score = (): string => q('.upvote-btn .score')?.textContent?.trim() ?? '';

  async function criar(logado: boolean): Promise<void> {
    localStorage.clear();
    if (logado) {
      localStorage.setItem(TOKEN_STORAGE_KEY, 'token-de-teste');
    }
    await TestBed.configureTestingModule({
      imports: [FeedComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FeedComponent);
    fixture.detectChanges();
    http.expectOne('/api/posts').flush([{ ...post }]);
    fixture.detectChanges();
  }

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('visitante: não envia o voto, não mexe no score e convida a entrar', async () => {
    await criar(false);
    votar();

    http.expectNone('/api/posts/7/upvote');
    expect(score()).toBe('3');
    const aviso = q('.voto-aviso');
    expect(aviso?.getAttribute('role')).toBe('alert');
    expect(aviso?.textContent).toContain('Entre na sua conta para votar.');
    expect(q('.voto-aviso a[href="/login"]')).toBeTruthy();
    expect(q('.voto-aviso a[href="/cadastro"]')).toBeTruthy();
    expect(q('.upvote-btn')?.getAttribute('aria-describedby')).toBe(aviso?.id);
  });

  it('fechar o aviso remove a mensagem e a descrição do botão', async () => {
    await criar(false);
    votar();
    (q('.voto-aviso-fechar') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(q('.voto-aviso')).toBeNull();
    expect(q('.upvote-btn')?.getAttribute('aria-describedby')).toBeNull();
  });

  it('logado: aplica o voto otimista e adota a resposta do servidor', async () => {
    await criar(true);
    votar();
    expect(score()).toBe('4');

    http.expectOne('/api/posts/7/upvote').flush({ ...post, score: 5, votadoPeloUsuario: true });
    fixture.detectChanges();

    expect(score()).toBe('5');
    expect(q('.upvote-btn')?.getAttribute('aria-pressed')).toBe('true');
    expect(q('.voto-aviso')).toBeNull();
  });

  it('logado: ignora cliques repetidos enquanto o voto está pendente', async () => {
    await criar(true);
    votar();
    votar();

    http.expectOne('/api/posts/7/upvote').flush({ ...post, score: 4, votadoPeloUsuario: true });
    fixture.detectChanges();
    expect(score()).toBe('4');
  });

  it('sessão expirada (401): desfaz o voto e pede para entrar de novo', async () => {
    await criar(true);
    votar();
    http
      .expectOne('/api/posts/7/upvote')
      .flush('não autorizado', { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(score()).toBe('3');
    expect(q('.upvote-btn')?.getAttribute('aria-pressed')).toBe('false');
    expect(q('.voto-aviso')?.textContent).toContain('Sua sessão expirou');
    expect(q('.voto-aviso a[href="/login"]')).toBeTruthy();
  });

  it('falha de servidor: desfaz o voto e avisa sem pedir login', async () => {
    await criar(true);
    votar();
    http.expectOne('/api/posts/7/upvote').flush('erro', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(score()).toBe('3');
    const aviso = q('.voto-aviso');
    expect(aviso?.classList.contains('voto-aviso-erro')).toBe(true);
    expect(aviso?.textContent).toContain('Não foi possível registrar seu voto');
    expect(q('.voto-aviso a')).toBeNull();
  });
});

describe('FeedComponent - categoria na URL', () => {
  let http: HttpTestingController;
  let router: Router;

  const post: Post = {
    id: 1,
    titulo: 'Arch ou Debian?',
    resumo: 'Resumo',
    categoria: 'distros',
    autor: 'tux',
    criadoEm: '2026-01-01T00:00:00Z',
    score: 0,
    totalComentarios: 0,
    votadoPeloUsuario: false,
  };

  const criar = async (url = '/'): Promise<ComponentFixture<FeedComponent>> => {
    await router.navigateByUrl(url);
    const fixture = TestBed.createComponent(FeedComponent);
    fixture.detectChanges();
    return fixture;
  };
  const q = (fixture: ComponentFixture<FeedComponent>, css: string): HTMLElement | null =>
    (fixture.nativeElement as HTMLElement).querySelector(css);

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [FeedComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('abre direto na categoria que vem na URL', async () => {
    const fixture = await criar('/?categoria=dotfiles');
    http.expectOne('/api/posts?categoria=dotfiles').flush([]);

    expect(fixture.componentInstance.categoriaAtiva()).toBe('dotfiles');
  });

  it('categoria inexistente na URL vira "Todos" e a URL é limpa', async () => {
    const fixture = await criar('/?categoria=nao-existe');
    http.expectOne('/api/posts').flush([]);
    await fixture.whenStable();

    expect(fixture.componentInstance.categoriaAtiva()).toBeNull();
    expect(router.url).toBe('/');
  });

  it('escolher uma categoria coloca na URL e "Todos" tira', async () => {
    const fixture = await criar();
    http.expectOne('/api/posts').flush([]);

    fixture.componentInstance.escolherCategoria('distros');
    http.expectOne('/api/posts?categoria=distros').flush([]);
    await fixture.whenStable();
    expect(router.url).toBe('/?categoria=distros');

    fixture.componentInstance.escolherCategoria(null);
    http.expectOne('/api/posts').flush([]);
    await fixture.whenStable();
    expect(router.url).toBe('/');
  });

  it('mudar a URL (como o Voltar do navegador) muda o filtro e recarrega', async () => {
    const fixture = await criar('/?categoria=distros');
    http.expectOne('/api/posts?categoria=distros').flush([]);

    await router.navigateByUrl('/?categoria=dotfiles');
    http.expectOne('/api/posts?categoria=dotfiles').flush([]);
    expect(fixture.componentInstance.categoriaAtiva()).toBe('dotfiles');

    await router.navigateByUrl('/');
    http.expectOne('/api/posts').flush([]);
    expect(fixture.componentInstance.categoriaAtiva()).toBeNull();
  });

  it('o título da aba acompanha a categoria e volta ao normal ao sair', async () => {
    const titulo = TestBed.inject(Title);
    const fixture = await criar('/?categoria=distros');
    http.expectOne('/api/posts?categoria=distros').flush([]);
    expect(titulo.getTitle()).toBe('Distros · TuxTalk');

    fixture.componentInstance.escolherCategoria(null);
    http.expectOne('/api/posts').flush([]);
    fixture.detectChanges();
    expect(titulo.getTitle()).toBe('TuxTalk');

    fixture.componentInstance.escolherCategoria('tiling-wms');
    http.expectOne('/api/posts?categoria=tiling-wms').flush([]);
    fixture.detectChanges();
    expect(titulo.getTitle()).toBe('Tiling-wms · TuxTalk');

    fixture.destroy();
    expect(titulo.getTitle()).toBe('TuxTalk');
  });

  it('"limpar filtro" só aparece com categoria ativa e volta para "Todos"', async () => {
    const fixture = await criar();
    http.expectOne('/api/posts').flush([]);
    fixture.detectChanges();
    expect(q(fixture, '.limpar-filtro')).toBeNull();

    fixture.componentInstance.escolherCategoria('dotfiles');
    http.expectOne('/api/posts?categoria=dotfiles').flush([]);
    fixture.detectChanges();
    const limpar = q(fixture, '.limpar-filtro') as HTMLButtonElement;
    expect(limpar.textContent).toContain('limpar filtro');
    expect(limpar.textContent).toContain('Dotfiles');

    limpar.click();
    http.expectOne('/api/posts').flush([]);
    fixture.detectChanges();
    expect(fixture.componentInstance.categoriaAtiva()).toBeNull();
    expect(q(fixture, '.limpar-filtro')).toBeNull();
  });

  it('cliques rápidos (categoria e logo "Todos") terminam em "Todos", sem recarregar a antiga', async () => {
    const fixture = await criar();
    http.expectOne('/api/posts').flush([]);

    // Sem esperar a navegação da primeira escolha terminar.
    fixture.componentInstance.escolherCategoria('distros');
    http.expectOne('/api/posts?categoria=distros').flush([]);
    fixture.componentInstance.escolherCategoria(null);
    http.expectOne('/api/posts').flush([]);
    await fixture.whenStable();

    expect(fixture.componentInstance.categoriaAtiva()).toBeNull();
    expect(router.url).toBe('/');
  });

  it('a resposta da categoria anterior não sobrescreve a atual', async () => {
    const fixture = await criar();
    const primeira = http.expectOne('/api/posts');

    fixture.componentInstance.selecionarCategoria('distros');
    const segunda = http.expectOne('/api/posts?categoria=distros');
    expect(primeira.cancelled).toBe(true);

    segunda.flush([post]);
    fixture.detectChanges();
    expect(fixture.componentInstance.posts()).toEqual([post]);
    expect(fixture.componentInstance.carregando()).toBe(false);
  });

  it('cancela a requisição pendente ao destruir a página', async () => {
    const fixture = await criar();
    const pendente = http.expectOne('/api/posts');

    fixture.destroy();
    expect(pendente.cancelled).toBe(true);
  });
});
