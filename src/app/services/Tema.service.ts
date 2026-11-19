import { Injectable, signal } from '@angular/core';

export type Tema = 'claro' | 'escuro';

export const TEMA_STORAGE_KEY = 'tuxtalk_tema';

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly temaAtual = signal<Tema>(this.temaInicial());

  /** Tema ativo. Somente leitura: para trocar, use `alternar()`. */
  readonly tema = this.temaAtual.asReadonly();

  constructor() {
    // Aplica o atributo já no bootstrap, antes de qualquer tela renderizar.
    this.aplicar(this.temaAtual());
  }

  alternar(): void {
    const proximo: Tema = this.temaAtual() === 'escuro' ? 'claro' : 'escuro';
    this.temaAtual.set(proximo);
    this.aplicar(proximo);
    this.salvar(proximo);
  }

  private temaInicial(): Tema {
    const salvo = this.lerSalvo();
    if (salvo) {
      return salvo;
    }
    try {
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'claro';
      }
    } catch {
      // matchMedia indisponível (ex.: jsdom): cai no padrão escuro.
    }
    return 'escuro';
  }

  private lerSalvo(): Tema | null {
    try {
      const valor = localStorage.getItem(TEMA_STORAGE_KEY);
      return valor === 'claro' || valor === 'escuro' ? valor : null;
    } catch {
      return null;
    }
  }

  private salvar(tema: Tema): void {
    try {
      localStorage.setItem(TEMA_STORAGE_KEY, tema);
    } catch {
      // Sem persistência (storage bloqueado ou cheio): o tema vale só para a sessão.
    }
  }

  private aplicar(tema: Tema): void {
    document.documentElement.dataset['theme'] = tema === 'claro' ? 'light' : 'dark';
  }
}
