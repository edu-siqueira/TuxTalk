import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { PostCardComponent } from '../post/post';
import { PostService } from '../../services/Post.service';
import { Post } from '../../models/Post';

import { ButtonModule, Button } from 'primeng/button';

interface CategoriaFiltro {
  slug: string | null; // null representa "todos"
  label: string;
}

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, PostCardComponent, ButtonModule, Button],
  templateUrl: './feed.html',
  styleUrls: ['./feed.scss'],
})
export class FeedComponent implements OnInit {
  private readonly postService = inject(PostService);
  private readonly router = inject(Router);

  // Seed fixo, sem CRUD de categoria
  readonly categorias: CategoriaFiltro[] = [
    { slug: null, label: 'Todos' },
    { slug: 'distros', label: 'Distros' },
    { slug: 'dotfiles', label: 'Dotfiles' },
    { slug: 'tiling-wms', label: 'Tiling-wms' },
    { slug: 'troubleshooting', label: 'Troubleshooting' },
  ];

  categoriaAtiva = signal<string | null>(null);
  posts = signal<Post[]>([]);
  carregando = signal(false);

  ngOnInit(): void {
    this.carregarPosts();
  }

  logout(): void {
    localStorage.removeItem('token');
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

  private carregarPosts(): void {
    this.carregando.set(true);
    this.postService.listar(this.categoriaAtiva() ?? undefined).subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
      },
    });
  }
}
