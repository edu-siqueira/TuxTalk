import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { PainelComponent } from '../../components/painel/painel';
import { JanelaComponent } from '../../components/janela/janela';
import { AuthService } from '../../services/Auth.service';
import { calcularRanking } from '../../services/Quiz.service';
import { DISTROS, PERGUNTAS } from '../../models/Quiz';

export type TelaQuiz = 'intro' | 'pergunta' | 'resultado';

const TITULO_BASE = 'TuxTalk';
const TITULO_PAGINA = 'Descubra sua distro';

/** Campos de texto: neles as teclas 1-4 são digitação, não atalho. */
const SELETOR_CAMPO_DE_TEXTO = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [PainelComponent, JanelaComponent],
  templateUrl: './quiz.html',
  styleUrls: ['./quiz.scss'],
})
export class QuizComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly tituloAba = inject(Title);
  private readonly injector = inject(Injector);

  private readonly titulo = viewChild<ElementRef<HTMLElement>>('titulo');

  readonly perguntas = PERGUNTAS;
  readonly total = PERGUNTAS.length;

  // Estado: só a tela, o índice e as respostas. O resultado é sempre derivado delas.
  readonly tela = signal<TelaQuiz>('intro');
  readonly indice = signal(0);
  /** respostas()[i] = índice da opção escolhida na pergunta i. */
  readonly respostas = signal<readonly number[]>([]);

  readonly perguntaAtual = computed(() => PERGUNTAS[this.indice()]);
  readonly respostaAtual = computed<number | undefined>(() => this.respostas()[this.indice()]);

  readonly ranking = computed(() =>
    calcularRanking(this.respostas().map((opcao, pergunta) => PERGUNTAS[pergunta].opcoes[opcao])),
  );
  readonly resultado = computed(() => {
    const [primeira, segunda] = this.ranking();
    return { vencedora: DISTROS[primeira.id], segunda: DISTROS[segunda.id] };
  });

  /** Caminho exibido na barra da janela (como o path do protótipo). */
  readonly caminho = computed(() => {
    switch (this.tela()) {
      case 'intro':
        return '~/quiz › início';
      case 'pergunta':
        return `~/quiz › pergunta ${this.indice() + 1}/${this.total}`;
      case 'resultado':
        return '~/quiz › resultado';
    }
  });

  /** Texto lido pelo leitor de tela (região aria-live) ao trocar de tela. */
  readonly anuncio = computed(() => {
    switch (this.tela()) {
      case 'intro':
        return '';
      case 'pergunta':
        return `Pergunta ${this.indice() + 1} de ${this.total}`;
      case 'resultado':
        return `Resultado pronto: ${this.resultado().vencedora.nome}`;
    }
  });

  constructor() {
    this.tituloAba.setTitle(`${TITULO_PAGINA} · ${TITULO_BASE}`);
    inject(DestroyRef).onDestroy(() => this.tituloAba.setTitle(TITULO_BASE));
  }

  iniciar(): void {
    this.indice.set(0);
    this.tela.set('pergunta');
    this.focarTitulo();
  }

  /** Registra a resposta da pergunta atual e avança (ou mostra o resultado na última). */
  responder(opcao: number): void {
    if (this.tela() !== 'pergunta' || opcao < 0 || opcao >= this.perguntaAtual().opcoes.length) {
      return;
    }
    const atual = this.indice();
    // Troca só a resposta desta pergunta: ao voltar e mudar uma, as seguintes continuam guardadas.
    this.respostas.update((r) => {
      const copia = [...r];
      copia[atual] = opcao;
      return copia;
    });

    if (atual + 1 < this.total) {
      this.indice.set(atual + 1);
    } else {
      this.tela.set('resultado');
    }
    this.focarTitulo();
  }

  /** Volta uma pergunta, sem apagar nenhuma resposta. No resultado, reabre a última pergunta. */
  voltar(): void {
    if (this.tela() === 'resultado') {
      this.indice.set(this.total - 1);
      this.tela.set('pergunta');
    } else if (this.tela() === 'pergunta' && this.indice() > 0) {
      this.indice.update((i) => i - 1);
    } else {
      return;
    }
    this.focarTitulo();
  }

  refazer(): void {
    this.respostas.set([]);
    this.indice.set(0);
    this.tela.set('intro');
    this.focarTitulo();
  }

  /** Atalhos 1-4 escolhem a opção correspondente, só durante uma pergunta. */
  @HostListener('document:keydown', ['$event'])
  aoPressionarTecla(evento: KeyboardEvent): void {
    if (this.tela() !== 'pergunta' || evento.defaultPrevented || evento.repeat) {
      return;
    }
    if (evento.ctrlKey || evento.altKey || evento.metaKey || evento.shiftKey) {
      return;
    }
    const alvo = evento.target;
    if (alvo instanceof Element && alvo.closest(SELETOR_CAMPO_DE_TEXTO)) {
      return;
    }
    if (!/^[1-9]$/.test(evento.key)) {
      return;
    }
    const opcao = Number(evento.key) - 1;
    if (opcao < this.perguntaAtual().opcoes.length) {
      evento.preventDefault();
      this.responder(opcao);
    }
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  /** Leva o foco ao título da nova tela depois de renderizar (leitor de tela anuncia a mudança). */
  private focarTitulo(): void {
    afterNextRender(() => this.titulo()?.nativeElement.focus(), { injector: this.injector });
  }
}
