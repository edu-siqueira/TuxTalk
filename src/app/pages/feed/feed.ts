import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { PostCardComponent } from '../post/post';
import { PainelComponent } from '../../components/painel/painel';
import { PostService } from '../../services/Post.service';
import { AuthService } from '../../services/Auth.service';
import { Post } from '../../models/Post';

interface CategoriaFiltro {
  slug: string | null; // null representa "todos"
  label: string;
  icone: string; // classe PrimeIcons; distinta por categoria para o trilho recolhido
}

export const SIDEBAR_RECOLHIDA_STORAGE_KEY = 'tuxtalk_sidebar_recolhida';

const CONSULTA_MOBILE = '(max-width: 767.98px)';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [PostCardComponent, PainelComponent],
  templateUrl: './feed.html',
  styleUrls: ['./feed.scss'],
})
export class FeedComponent implements OnInit {
  private readonly postService = inject(PostService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Seed fixo, sem CRUD de categoria
  readonly categorias: CategoriaFiltro[] = [
    { slug: null, label: 'Todos', icone: 'pi-th-large' },
    { slug: 'distros', label: 'Distros', icone: 'pi-desktop' },
    { slug: 'dotfiles', label: 'Dotfiles', icone: 'pi-file-edit' },
    { slug: 'tiling-wms', label: 'Tiling-wms', icone: 'pi-window-maximize' },
    { slug: 'troubleshooting', label: 'Troubleshooting', icone: 'pi-wrench' },
  ];

  private readonly injector = inject(Injector);
  private readonly sidebar = viewChild<ElementRef<HTMLElement>>('sidebar');
  private readonly botaoGaveta = viewChild<ElementRef<HTMLButtonElement>>('botaoGaveta');

  /** Preferência do desktop (trilho de ícones). Ignorada no mobile. */
  readonly sidebarRecolhida = signal(this.lerRecolhida());
  /** Gaveta off-canvas do mobile. */
  readonly gavetaAberta = signal(false);
  /** Viewport < 768px, via matchMedia (false se indisponível, ex.: jsdom). */
  readonly ehMobile = signal(false);

  /** Trilho só vale no desktop. */
  readonly trilho = computed(() => this.sidebarRecolhida() && !this.ehMobile());

  categoriaAtiva = signal<string | null>(null);
  posts = signal<Post[]>([]);
  carregando = signal(false);
  erro = signal<string | null>(null);

  readonly rotuloCategoriaAtiva = computed(
    () => this.categorias.find((c) => c.slug === this.categoriaAtiva())?.label ?? 'Todos',
  );

  /** Liga as transições só após o primeiro render, para não animar no carregamento. */
  readonly animar = signal(false);

  constructor() {
    this.observarBreakpoint();
    afterNextRender(() => this.animar.set(true));
  }

  ngOnInit(): void {
    this.carregarPosts();
  }

  alternarSidebar(): void {
    const proximo = !this.sidebarRecolhida();
    this.sidebarRecolhida.set(proximo);
    try {
      localStorage.setItem(SIDEBAR_RECOLHIDA_STORAGE_KEY, String(proximo));
    } catch {
      // Sem persistência (storage bloqueado ou cheio): vale só para a sessão.
    }
  }

  abrirGaveta(): void {
    this.gavetaAberta.set(true);
    // Espera a gaveta ficar visível antes de focar (elemento invisível não recebe foco).
    afterNextRender(
      () => {
        const raiz = this.sidebar()?.nativeElement;
        const alvo =
          raiz?.querySelector<HTMLElement>('.categoria-item.ativo') ??
          raiz?.querySelector<HTMLElement>('.categoria-item');
        alvo?.focus();
      },
      { injector: this.injector },
    );
  }

  fecharGaveta(devolverFoco = true): void {
    if (!this.gavetaAberta()) {
      return;
    }
    this.gavetaAberta.set(false);
    if (devolverFoco) {
      this.botaoGaveta()?.nativeElement.focus();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.ehMobile()) {
      this.fecharGaveta();
    }
  }

  /** Mantém o Tab dentro da gaveta enquanto ela é modal. */
  onTabNaGaveta(evento: Event): void {
    if (!this.ehMobile() || !this.gavetaAberta()) {
      return;
    }
    const foco = Array.from(
      this.sidebar()?.nativeElement.querySelectorAll<HTMLElement>('button') ?? [],
    );
    if (foco.length === 0) {
      return;
    }
    const tab = evento as KeyboardEvent;
    const primeiro = foco[0];
    const ultimo = foco[foco.length - 1];
    const ativo = document.activeElement;
    if (tab.shiftKey && ativo === primeiro) {
      tab.preventDefault();
      ultimo.focus();
    } else if (!tab.shiftKey && ativo === ultimo) {
      tab.preventDefault();
      primeiro.focus();
    }
  }

  escolherCategoria(slug: string | null): void {
    this.selecionarCategoria(slug);
    if (this.ehMobile()) {
      this.fecharGaveta();
    }
  }

  private observarBreakpoint(): void {
    let consulta: MediaQueryList;
    try {
      consulta = window.matchMedia(CONSULTA_MOBILE);
    } catch {
      return; // matchMedia indisponível: fica no layout desktop.
    }
    if (!consulta) {
      return;
    }
    this.ehMobile.set(consulta.matches);
    const aoMudar = (e: MediaQueryListEvent) => {
      // Troca de layout (girar tablet, redimensionar) não anima: a gaveta
      // deslizaria para fora ao virar mobile. Religa após o próximo render.
      this.animar.set(false);
      afterNextRender(() => this.animar.set(true), { injector: this.injector });
      this.ehMobile.set(e.matches);
      if (!e.matches) {
        this.fecharGaveta(false); // o botão da gaveta some no desktop
      }
    };
    consulta.addEventListener?.('change', aoMudar);
    inject(DestroyRef).onDestroy(() => consulta.removeEventListener?.('change', aoMudar));
  }

  private lerRecolhida(): boolean {
    try {
      return localStorage.getItem(SIDEBAR_RECOLHIDA_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  selecionarCategoria(slug: string | null): void {
    if (slug === this.categoriaAtiva()) {
      return;
    }
    this.categoriaAtiva.set(slug);
    this.carregarPosts();
  }

  onUpvote(postId: number): void {
    const post = this.posts().find((p) => p.id === postId);
    if (!post) {
      return;
    }
    const votadoAnterior = post.votadoPeloUsuario;
    const delta = votadoAnterior ? -1 : 1;

    this.atualizarPost(postId, { votadoPeloUsuario: !votadoAnterior, score: post.score + delta });

    this.postService.alternarUpvote(postId).subscribe({
      error: () => {
        this.atualizarPost(postId, { votadoPeloUsuario: votadoAnterior, score: post.score });
      },
    });
  }

  private atualizarPost(postId: number, mudancas: Partial<Post>): void {
    this.posts.update((lista) => lista.map((p) => (p.id === postId ? { ...p, ...mudancas } : p)));
  }

  carregarPosts(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.postService.listar(this.categoriaAtiva() ?? undefined).subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.carregando.set(false);
      },
      error: () => {
        this.posts.set([]); // não mostrar a lista da categoria anterior junto com o erro
        this.erro.set('Não foi possível carregar os posts. Tente novamente.');
        this.carregando.set(false);
      },
    });
  }
}
