import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { JanelaComponent } from '../../components/janela/janela';
import { Post } from '../../models/Post';

const UNIDADES: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** Data relativa em português ("há 3 dias", "ontem"). `agora` é injetável para testes. */
export function formatarDataRelativa(iso: string, agora: number = Date.now()): string {
  const data = new Date(iso).getTime();
  if (Number.isNaN(data)) {
    return '';
  }
  const segundos = Math.round((data - agora) / 1000);
  if (Math.abs(segundos) < 60) {
    return 'agora há pouco';
  }
  const formato = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  for (const [unidade, tamanho] of UNIDADES) {
    if (Math.abs(segundos) >= tamanho) {
      return formato.format(Math.trunc(segundos / tamanho), unidade);
    }
  }
  return 'agora há pouco';
}

/** Aviso exibido junto ao upvote quando o voto não pôde ser registrado. */
export interface AvisoVoto {
  mensagem: string;
  /** true: o problema é falta de login, então o aviso oferece Entrar / Criar conta. */
  pedirLogin: boolean;
}

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [JanelaComponent, RouterLink],
  templateUrl: './post.html',
  styleUrls: ['./post.scss'],
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;

  /** Aviso sobre o voto neste post (ex.: visitante sem login). O pai decide quando mostrar. */
  @Input() aviso: AvisoVoto | null = null;

  // Emite o id em vez de chamar o service diretamente
  // (só exibe e notifica), quem decide como tratar o upvote é o componente pai.
  @Output() upvote = new EventEmitter<number>();

  @Output() fecharAviso = new EventEmitter<void>();

  get avisoId(): string {
    return `voto-aviso-${this.post.id}`;
  }

  /** Nome acessível do upvote: diz em qual post se vota e quantos votos ele tem. */
  get rotuloVoto(): string {
    const votos = this.post.score === 1 ? '1 voto' : `${this.post.score} votos`;
    return `Votar em “${this.post.titulo}”, ${votos}`;
  }

  get rotuloComentarios(): string {
    return this.post.totalComentarios === 1 ? '1 comentário' : `${this.post.totalComentarios} comentários`;
  }

  /** "há 3 dias", "ontem", "há 2 semanas"... */
  get dataRelativa(): string {
    return formatarDataRelativa(this.post.criadoEm);
  }

  /** "30 de outubro de 2026 às 10:55", para o title do <time>. */
  get dataCompleta(): string {
    const data = new Date(this.post.criadoEm);
    if (Number.isNaN(data.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(data);
  }

  // Caminho estilo arquivo para a barra de título: "distros/" (categoria em minúsculas, sem espaços).
  caminho(): string {
    return this.post.categoria.trim().toLowerCase().replace(/\s+/g, '-') + '/';
  }

  onUpvoteClick(evento: MouseEvent): void {
    evento.stopPropagation(); // não propaga o clique da seta para o card (útil quando houver página de detalhe)
    this.upvote.emit(this.post.id);
  }
}
