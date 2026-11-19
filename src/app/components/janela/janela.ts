import { Component, input } from '@angular/core';

/** Moldura de janela estilo KDE Breeze: barra de título + corpo projetado. */
@Component({
  selector: 'app-janela',
  standalone: true,
  templateUrl: './janela.html',
  styleUrls: ['./janela.scss'],
})
export class JanelaComponent {
  readonly titulo = input.required<string>();
  readonly prompt = input<string>();
  /** Exibe os ícones decorativos de minimizar/maximizar/fechar na barra. */
  readonly controles = input<boolean>(false);
}
