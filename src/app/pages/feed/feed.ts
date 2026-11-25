import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AvisoVoto, PostCardComponent } from '../post/post';
import { PainelComponent } from '../../components/painel/painel';
import { PostService } from '../../services/Post.service';
import { AuthService, TOKEN_STORAGE_KEY } from '../../services/Auth.service';
import { Post } from '../../models/Post';

/**
 * Lê o nome do usuário do JWT salvo (campo `sub`/`username`), sem validar a assinatura:
 * serve só para exibição. Sem token ou com token ilegível: "visitante" / "usuario".
 */
export function lerNomeDoToken(): string {
  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return 'visitante';
  }
  if (!token) {
    return 'visitante';
  }
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    const nome = payload.username ?? payload.sub;
    return typeof nome === 'string' && /^[\w.-]{1,32}$/.test(nome) ? nome : 'usuario';
  } catch {
    return 'usuario';
  }
}

export const AVISO_LOGIN: AvisoVoto = { mensagem: 'Entre na sua conta para votar.', pedirLogin: true };
export const AVISO_SESSAO: AvisoVoto = {
  mensagem: 'Sua sessão expirou. Entre de novo para votar.',
  pedirLogin: true,
};
export const AVISO_FALHA: AvisoVoto = {
  mensagem: 'Não foi possível registrar seu voto. Tente de novo.',
  pedirLogin: false,
};

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
  private readonly listaPosts = viewChild<ElementRef<HTMLElement>>('listaPosts');

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

  /** Aviso de voto ativo (um por vez, ligado ao post onde o clique aconteceu). */
  readonly avisoVoto = signal<{ postId: number; aviso: AvisoVoto } | null>(null);
  private readonly votosPendentes = new Set<number>();

  readonly rotuloCategoriaAtiva = computed(
    () => this.categorias.find((c) => c.slug === this.categoriaAtiva())?.label ?? 'Todos',
  );

  /** Nome no prompt do cabeçalho: o usuário do token, ou "visitante" sem login. */
  readonly nomeNoPrompt = lerNomeDoToken();

  readonly textoVazio = computed(() =>
    this.categoriaAtiva()
      ? `Ainda não há posts em ${this.rotuloCategoriaAtiva()}.`
      : 'Ainda não há posts por aqui.',
  );

  /** Texto do anúncio para leitores de tela depois de carregar ("3 posts em Distros"). */
  readonly resumoResultados = computed(() => {
    if (this.carregando() || this.erro()) {
      return '';
    }
    const n = this.posts().length;
    const quantidade = n === 0 ? 'Nenhum post' : n === 1 ? '1 post' : `${n} posts`;
    return this.categoriaAtiva() ? `${quantidade} em ${this.rotuloCategoriaAtiva()}` : quantidade;
  });

  /** Liga as transições só após o primeiro render, para não animar no carregamento. */
  readonly animar = signal(false);

  /** Gaveta mobile aberta: o resto da página fica inerte e sem rolagem. */
  readonly gavetaModal = computed(() => this.ehMobile() && this.gavetaAberta());

  constructor() {
    this.observarBreakpoint();
    afterNextRender(() => this.animar.set(true));

    effect(() => {
      document.documentElement.classList.toggle('tux-sem-rolagem', this.gavetaModal());
    });
    inject(DestroyRef).onDestroy(() =>
      document.documentElement.classList.remove('tux-sem-rolagem'),
    );
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
    // O CSS torna a gaveta aberta visível sem atraso; o reforço no próximo quadro cobre
    // navegadores que ainda aplicam o estilo antigo no primeiro render.
    afterNextRender(
      () => {
        this.focarItemDaGaveta();
        requestAnimationFrame(() => {
          const raiz = this.sidebar()?.nativeElement;
          if (this.gavetaAberta() && raiz && !raiz.contains(document.activeElement)) {
            this.focarItemDaGaveta();
          }
        });
      },
      { injector: this.injector },
    );
  }

  private focarItemDaGaveta(): void {
    const raiz = this.sidebar()?.nativeElement;
    const alvo =
      raiz?.querySelector<HTMLElement>('.categoria-item.ativo') ??
      raiz?.querySelector<HTMLElement>('.categoria-item');
    alvo?.focus();
  }

  /** Link "Pular para os posts": move o foco para a lista sem mudar a rota. */
  pularParaPosts(evento: Event): void {
    evento.preventDefault();
    const lista = this.listaPosts()?.nativeElement;
    lista?.focus();
    lista?.scrollIntoView?.({ block: 'start' }); // ausente em ambientes sem layout (jsdom)
  }

  fecharGaveta(devolverFoco = true): void {
    if (!this.gavetaAberta()) {
      return;
    }
    this.gavetaAberta.set(false);
    if (devolverFoco) {
      // O botão fica dentro de .feed-conteudo, que está `inert` até o próximo render:
      // focar antes disso falharia e deixaria o foco preso na gaveta escondida.
      afterNextRender(() => this.botaoGaveta()?.nativeElement.focus(), { injector: this.injector });
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
    if (!post || this.votosPendentes.has(postId)) {
      return; // ignora cliques repetidos enquanto o voto anterior não volta
    }

    // Visitante: não finge que votou (o back responderia 401). Convida a entrar.
    if (!this.estaLogado()) {
      this.avisoVoto.set({ postId, aviso: AVISO_LOGIN });
      return;
    }

    this.avisoVoto.set(null);
    const votadoAnterior = post.votadoPeloUsuario;
    const delta = votadoAnterior ? -1 : 1;

    this.votosPendentes.add(postId);
    this.atualizarPost(postId, { votadoPeloUsuario: !votadoAnterior, score: post.score + delta });

    this.postService.alternarUpvote(postId).subscribe({
      next: (atualizado) => {
        this.votosPendentes.delete(postId);
        // O servidor é a fonte da verdade (outros usuários podem ter votado no meio-tempo).
        if (atualizado) {
          this.atualizarPost(postId, {
            votadoPeloUsuario: atualizado.votadoPeloUsuario,
            score: atualizado.score,
          });
        }
      },
      error: (erro: HttpErrorResponse) => {
        this.votosPendentes.delete(postId);
        // Desfaz só o delta otimista, sobre o score atual (não sobre o capturado no clique).
        this.posts.update((lista) =>
          lista.map((p) =>
            p.id === postId ? { ...p, votadoPeloUsuario: votadoAnterior, score: p.score - delta } : p,
          ),
        );
        const sessaoInvalida = erro?.status === 401 || erro?.status === 403;
        this.avisoVoto.set({ postId, aviso: sessaoInvalida ? AVISO_SESSAO : AVISO_FALHA });
      },
    });
  }

  avisoDoPost(postId: number): AvisoVoto | null {
    const atual = this.avisoVoto();
    return atual?.postId === postId ? atual.aviso : null;
  }

  fecharAvisoVoto(): void {
    this.avisoVoto.set(null);
  }

  private estaLogado(): boolean {
    try {
      return !!localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return false;
    }
  }

  private atualizarPost(postId: number, mudancas: Partial<Post>): void {
    this.posts.update((lista) => lista.map((p) => (p.id === postId ? { ...p, ...mudancas } : p)));
  }

  carregarPosts(): void {
    this.avisoVoto.set(null);
    this.carregando.set(true);
    this.erro.set(null);
    this.postService.listar(this.categoriaAtiva() ?? undefined).subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.carregando.set(false);
      },
      error: () => {
        this.posts.set([]); // não mostrar a lista da categoria anterior junto com o erro
        this.erro.set('Não foi possível carregar os posts.');
        this.carregando.set(false);
      },
    });
  }
}
