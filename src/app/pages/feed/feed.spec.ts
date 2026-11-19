import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';

import { FeedComponent, SIDEBAR_RECOLHIDA_STORAGE_KEY } from './feed';
import { PainelComponent } from '../../components/painel/painel';
import { AuthService } from '../../services/Auth.service';
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

  function simularMatchMedia(mobile: boolean): void {
    aoMudarBreakpoint = undefined;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: () => ({
        matches: mobile,
        addEventListener: (_tipo: string, fn: (e: { matches: boolean }) => void) => {
          aoMudarBreakpoint = fn;
        },
        removeEventListener: () => undefined,
      }),
    });
  }

  async function criar(mobile = false): Promise<void> {
    simularMatchMedia(mobile);
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
  });
});
