import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as AOS from 'aos';

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

  ngOnInit() {
    AOS.init({
      duration: 1200,
      once: true
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      AOS.refresh();
    }, 100);
  }

  readonly destaques: Destaque[] = [
    {
      icone: 'pi pi-th-large',
      titulo: 'Categorias',
      descricao: 'Distros, dotfiles, troubleshooting e mais.',
    },
    {
      icone: 'pi pi-comments',
      titulo: 'Discussões diretas',
      descricao: 'Comentários simples, sem burocracia.',
    },
    {
      icone: 'pi pi-arrow-up',
      titulo: 'Upvotes',
      descricao: 'O melhor conteúdo sobe pro topo.',
    },
  ];
}
