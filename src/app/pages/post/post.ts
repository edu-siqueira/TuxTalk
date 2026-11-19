import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';

import { JanelaComponent } from '../../components/janela/janela';
import { Post } from '../../models/Post';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [DatePipe, JanelaComponent],
  templateUrl: './post.html',
  styleUrls: ['./post.scss'],
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;

  // Emite o id em vez de chamar o service diretamente
  // (só exibe e notifica), quem decide como tratar o upvote é o componente pai.
  @Output() upvote = new EventEmitter<number>();

  // Caminho estilo arquivo para a barra de título: "distros/" (categoria em minúsculas, sem espaços).
  caminho(): string {
    return this.post.categoria.trim().toLowerCase().replace(/\s+/g, '-') + '/';
  }

  onUpvoteClick(evento: MouseEvent): void {
    evento.stopPropagation(); // não propaga o clique da seta para o card (útil quando houver página de detalhe)
    this.upvote.emit(this.post.id);
  }
}
