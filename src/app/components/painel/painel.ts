import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { TOKEN_STORAGE_KEY } from '../../services/Auth.service';
import { TemaService } from '../../services/Tema.service';

/**
 * Barra estilo painel do Plasma: lançador (marca), itens de tarefa e bandeja.
 *
 * O painel não faz logout por conta própria: emite `sair` e a página decide o que fazer
 * (hoje o FeedComponent chama AuthService.logout() e navega para /login).
 */
@Component({
  selector: 'app-painel',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './painel.html',
  styleUrls: ['./painel.scss'],
})
export class PainelComponent {
  private readonly temaService = inject(TemaService);

  /**
   * Força o estado logado/deslogado. Quando omitido, o painel considera logado
   * quem tem token salvo em localStorage (TOKEN_STORAGE_KEY), lido uma vez ao criar o painel.
   */
  readonly logado = input<boolean | undefined>(undefined);

  readonly sair = output<void>();

  private readonly temToken = this.existeToken();

  protected readonly estaLogado = computed(() => this.logado() ?? this.temToken);
  protected readonly destinoMarca = computed(() => (this.estaLogado() ? '/feed' : '/inicio'));
  protected readonly temaClaro = computed(() => this.temaService.tema() === 'claro');

  protected alternarTema(): void {
    this.temaService.alternar();
  }

  protected aoSair(): void {
    this.sair.emit();
  }

  private existeToken(): boolean {
    try {
      return !!localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return false;
    }
  }
}
