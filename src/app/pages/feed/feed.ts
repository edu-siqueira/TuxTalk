import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PostCardComponent } from '../post/post';
import { PostService } from '../../services/Post.service';
import { Post } from '../../models/Post';

interface CategoriaFiltro {
  slug: string | null; // null representa "todos"
  label: string;
}

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, PostCardComponent],
  templateUrl: './feed.html',
  styleUrls: ['./feed.scss'],
})
export class FeedComponent implements OnInit {
  private readonly postService = inject(PostService);

  // Seed fixo, sem CRUD de categoria
  readonly categorias: CategoriaFiltro[] = [
    { slug: null, label: 'Todos' },
    { slug: 'distros', label: 'Distros' },
    { slug: 'dotfiles', label: 'Dotfiles' },
    { slug: 'tiling-wms', label: 'Tiling-wms' },
    { slug: 'troubleshooting', label: 'Troubleshooting' },
  ];

  categoriaAtiva: string | null = null;
  posts: Post[] = [];
  carregando = false;

  ngOnInit(): void {
    this.carregarPosts();
  }

  selecionarCategoria(slug: string | null): void {
    if (slug === this.categoriaAtiva) {
      return;
    }
    this.categoriaAtiva = slug;
    this.carregarPosts();
  }

  onUpvote(postId: number): void {
    // Atualização otimista: reflete a mudança na UI antes da resposta do backend
    // chegar, pra dar sensação de resposta instantânea no clique.
    const post = this.posts.find((p) => p.id === postId);
    if (!post) {
      return;
    }
    const votadoAnterior = post.votadoPeloUsuario;
    post.votadoPeloUsuario = !votadoAnterior;
    post.score += votadoAnterior ? -1 : 1;

    this.postService.alternarUpvote(postId).subscribe({
      error: () => {
        // Reverte em caso de falha na chamada
        post.votadoPeloUsuario = votadoAnterior;
        post.score += votadoAnterior ? 1 : -1;
      },
    });
  }

  private carregarPosts(): void {
    this.carregando = true;
    this.postService.listar(this.categoriaAtiva ?? undefined).subscribe({
      next: (posts) => {
        this.posts = posts;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
      },
    });
  }
}
