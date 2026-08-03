import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Destaque {
  icone: string;
  titulo: string;
  descricao: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.scss'],
})
export class InicioComponent {
  readonly destaques: Destaque[] = [
    {
      icone: 'pi pi-th-large',
      titulo: 'Categorias',
      descricao: 'distros, dotfiles, troubleshooting e mais.',
    },
    {
      icone: 'pi pi-comments',
      titulo: 'Discussões diretas',
      descricao: 'comentários simples, sem burocracia.',
    },
    {
      icone: 'pi pi-arrow-up',
      titulo: 'Upvotes',
      descricao: 'o melhor conteúdo sobe pro topo.',
    },
  ];
}
