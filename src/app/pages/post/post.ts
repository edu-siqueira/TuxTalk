import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Post } from '../../models/Post';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './post.html',
  styleUrls: ['./post.scss'],
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;

  // Emite o id em vez de chamar o service diretamente
  // (só exibe e notifica), quem decide como tratar o upvote é o componente pai.
  @Output() upvote = new EventEmitter<number>();

  onUpvoteClick(evento: MouseEvent): void {
    evento.stopPropagation(); // evita disparar a navegação pro post ao clicar na seta
    this.upvote.emit(this.post.id);
  }
}
