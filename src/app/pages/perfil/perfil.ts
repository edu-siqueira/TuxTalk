import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  EMPTY,
  Subject,
  Subscription,
  catchError,
  combineLatest,
  forkJoin,
  map,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

import { PainelComponent } from '../../components/painel/painel';
import { JanelaComponent } from '../../components/janela/janela';
import { AvisoVoto, PostCardComponent } from '../post/post';
import { AuthService, TOKEN_STORAGE_KEY } from '../../services/Auth.service';
import { PostService } from '../../services/Post.service';
import { UsuarioService } from '../../services/Usuario.service';
import { PerfilUsuario } from '../../models/Usuario';
import { Post } from '../../models/Post';

export const BIO_MAX = 280;
export const AVATAR_URL_MAX = 500;

const TITULO_BASE = 'TuxTalk';

/** http(s)://, sem diferenciar maiúsculas, avaliado depois do trim; vazio é válido. */
const urlHttpValida: ValidatorFn = (c: AbstractControl): ValidationErrors | null => {
  const valor = typeof c.value === 'string' ? c.value.trim() : '';
  return valor === '' || /^https?:\/\/\S+$/i.test(valor) ? null : { pattern: true };
};

export type EstadoPerfil = 'carregando' | 'pronto' | 'naoEncontrado' | 'erro';

const AVISO_LOGIN: AvisoVoto = { mensagem: 'Entre na sua conta para votar.', pedirLogin: true };
const AVISO_SESSAO: AvisoVoto = { mensagem: 'Sua sessão expirou. Entre de novo para votar.', pedirLogin: true };
const AVISO_FALHA: AvisoVoto = { mensagem: 'Não foi possível registrar seu voto. Tente de novo.', pedirLogin: false };

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [PainelComponent, JanelaComponent, PostCardComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.scss'],
})
export class PerfilComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly postService = inject(PostService);
  private readonly tituloAba = inject(Title);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly bioMax = BIO_MAX;
  readonly avatarUrlMax = AVATAR_URL_MAX;

  readonly estado = signal<EstadoPerfil>('carregando');
  readonly perfil = signal<PerfilUsuario | null>(null);
  readonly posts = signal<Post[]>([]);
  /** Imagem do avatar que falhou ao carregar: cai para a inicial do username. */
  private readonly avatarQuebrado = signal<string | null>(null);

  readonly editando = signal(false);
  readonly salvando = signal(false);
  readonly erroSalvar = signal<string | null>(null);
  /** Mensagens do back por campo (400 com `campos`). */
  readonly errosCampos = signal<{ bio?: string; avatarUrl?: string }>({});

  readonly avisoVoto = signal<{ postId: number; aviso: AvisoVoto } | null>(null);
  private readonly votosPendentes = new Set<number>();

  readonly form = this.fb.group({
    bio: ['', [Validators.maxLength(BIO_MAX)]],
    avatarUrl: ['', [Validators.maxLength(AVATAR_URL_MAX), urlHttpValida]],
  });

  /** Assinatura do PUT em andamento (cancelada ao trocar de perfil ou destruir a página). */
  private salvarSub?: Subscription;
  private readonly recarregar = new Subject<void>();
  private readonly destroyRef = inject(DestroyRef);

  readonly inicial = computed(() => (this.perfil()?.username.charAt(0) ?? '?').toUpperCase());

  readonly avatarVisivel = computed(() => {
    const url = this.perfil()?.avatarUrl;
    return url && url !== this.avatarQuebrado() ? url : null;
  });

  readonly membroDesde = computed(() => {
    const data = new Date(this.perfil()?.criadoEm ?? '');
    if (Number.isNaN(data.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(data);
  });

  /** Caracteres usados na bio dentro do form (para o contador). */
  readonly caracteresBio = signal(0);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.tituloAba.setTitle(TITULO_BASE));

    this.form.controls.bio.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((v) => this.caracteresBio.set(v.length));

    this.destroyRef.onDestroy(() => this.salvarSub?.unsubscribe());

    // Reage à troca de :username e ao "Tentar de novo" na mesma instância; o switchMap cancela
    // a carga anterior em qualquer caso (e o takeUntilDestroyed cancela no destroy).
    combineLatest([this.route.paramMap, this.recarregar.pipe(startWith(undefined))])
      .pipe(
        map(([params]) => params.get('username') ?? ''),
        tap((username) => {
          this.salvarSub?.unsubscribe();
          this.salvando.set(false);
          this.estado.set('carregando');
          this.perfil.set(null);
          this.posts.set([]);
          this.avisoVoto.set(null);
          this.fecharEdicao();
          this.tituloAba.setTitle(`@${username} · ${TITULO_BASE}`);
        }),
        switchMap((username) => this.carregar(username)),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  private carregar(username: string) {
    return forkJoin([
      this.usuarioService.buscarPerfil(username),
      this.usuarioService.listarPosts(username),
    ]).pipe(
      tap(([perfil, posts]) => {
        this.perfil.set(perfil);
        this.posts.set(posts);
        this.estado.set('pronto');
        this.tituloAba.setTitle(`@${perfil.username} · ${TITULO_BASE}`);
      }),
      catchError((erro: HttpErrorResponse) => {
        const naoEncontrado = erro?.status === 404;
        this.estado.set(naoEncontrado ? 'naoEncontrado' : 'erro');
        this.tituloAba.setTitle(
          naoEncontrado ? `Usuário não encontrado · ${TITULO_BASE}` : TITULO_BASE,
        );
        return EMPTY;
      }),
    );
  }

  tentarDeNovo(): void {
    this.recarregar.next();
  }

  aoFalharAvatar(): void {
    this.avatarQuebrado.set(this.perfil()?.avatarUrl ?? null);
  }

  // ---- edição ----
  abrirEdicao(): void {
    const p = this.perfil();
    if (!p?.proprio) {
      return;
    }
    this.form.reset({ bio: p.bio ?? '', avatarUrl: p.avatarUrl ?? '' });
    this.caracteresBio.set((p.bio ?? '').length);
    this.erroSalvar.set(null);
    this.editando.set(true);
  }

  fecharEdicao(): void {
    this.editando.set(false);
    this.erroSalvar.set(null);
    this.errosCampos.set({});
  }

  salvar(): void {
    if (this.form.invalid || this.salvando()) {
      this.form.markAllAsTouched();
      return;
    }
    const { bio, avatarUrl } = this.form.getRawValue();
    this.salvando.set(true);
    this.erroSalvar.set(null);
    this.errosCampos.set({});
    this.salvarSub?.unsubscribe();
    this.salvarSub = this.usuarioService
      .atualizarMeuPerfil({ bio: bio.trim() || null, avatarUrl: avatarUrl.trim() || null })
      .subscribe({
        next: (atualizado) => {
          this.perfil.set(atualizado);
          this.salvando.set(false);
          this.editando.set(false);
        },
        error: (erro: HttpErrorResponse) => {
          this.salvando.set(false);
          if (erro?.status === 400) {
            const campos = erro.error?.campos;
            const porCampo: { bio?: string; avatarUrl?: string } = {};
            if (campos && typeof campos === 'object') {
              if (typeof campos.bio === 'string') {
                porCampo.bio = campos.bio;
              }
              if (typeof campos.avatarUrl === 'string') {
                porCampo.avatarUrl = campos.avatarUrl;
              }
            }
            if (porCampo.bio || porCampo.avatarUrl) {
              this.errosCampos.set(porCampo);
              return;
            }
            if (typeof erro.error?.mensagem === 'string') {
              this.erroSalvar.set(erro.error.mensagem);
              return;
            }
          }
          this.erroSalvar.set('Não foi possível salvar o perfil. Tente de novo.');
        },
      });
  }

  // ---- posts do usuário (mesmo voto do feed) ----
  onUpvote(postId: number): void {
    const post = this.posts().find((p) => p.id === postId);
    if (!post || this.votosPendentes.has(postId)) {
      return;
    }
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
        if (atualizado) {
          this.atualizarPost(postId, {
            votadoPeloUsuario: atualizado.votadoPeloUsuario,
            score: atualizado.score,
          });
        }
      },
      error: (erro: HttpErrorResponse) => {
        this.votosPendentes.delete(postId);
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

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
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
}
