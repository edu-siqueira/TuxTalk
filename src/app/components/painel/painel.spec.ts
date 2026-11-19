import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { PainelComponent } from './painel';
import { TOKEN_STORAGE_KEY } from '../../services/Auth.service';
import { TEMA_STORAGE_KEY } from '../../services/Tema.service';

describe('PainelComponent', () => {
  let fixture: ComponentFixture<PainelComponent>;

  const raiz = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const seletor = <T extends HTMLElement = HTMLElement>(css: string): T | null =>
    raiz().querySelector<T>(css);
  const href = (css: string): string | null => seletor(css)?.getAttribute('href') ?? null;

  const criar = (logado?: boolean): void => {
    fixture = TestBed.createComponent(PainelComponent);
    if (logado !== undefined) {
      fixture.componentRef.setInput('logado', logado);
    }
    fixture.detectChanges();
  };

  beforeEach(async () => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
    // Sem preferência do sistema por padrão: o tema inicial é o escuro.
    vi.stubGlobal('matchMedia', (consulta: string) => ({ matches: false, media: consulta }));

    await TestBed.configureTestingModule({
      imports: [PainelComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  it('should create', () => {
    criar();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('mostra os itens de tarefa Início e Feed com os links certos', () => {
    criar();

    expect(href('.painel-tarefas a[aria-label="Início"]')).toBe('/inicio');
    expect(href('.painel-tarefas a[aria-label="Feed"]')).toBe('/feed');
  });

  it('usa a logo pequena e uma marca TuxTalk', () => {
    criar();

    expect(seletor('.painel-logo')?.getAttribute('src')).toBe('tuxtalk-icon-128.png');
    expect(seletor('.painel-marca')?.textContent).toContain('TuxTalk');
  });

  describe('deslogado', () => {
    it('mostra Entrar e Criar conta e esconde Sair', () => {
      criar();

      expect(href('.painel-entrar')).toBe('/login');
      expect(seletor('.painel-entrar')?.textContent).toContain('Entrar');
      expect(href('.painel-criar')).toBe('/cadastro');
      expect(seletor('.painel-criar')?.textContent).toContain('Criar conta');
      expect(seletor('.painel-sair')).toBeNull();
    });

    it('a marca aponta para /inicio', () => {
      criar();
      expect(href('.painel-lancador')).toBe('/inicio');
    });
  });

  describe('logado', () => {
    it('detecta o token salvo, mostra Sair e esconde Entrar e Criar conta', () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, 'token-falso');
      criar();

      expect(seletor('.painel-sair')).toBeTruthy();
      expect(seletor('.painel-sair')?.getAttribute('aria-label')).toBe('Sair da conta');
      expect(seletor('.painel-entrar')).toBeNull();
      expect(seletor('.painel-criar')).toBeNull();
    });

    it('a marca aponta para /feed', () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, 'token-falso');
      criar();
      expect(href('.painel-lancador')).toBe('/feed');
    });

    it('o input logado sobrepõe a detecção por token', () => {
      criar(true);
      expect(seletor('.painel-sair')).toBeTruthy();
      expect(href('.painel-lancador')).toBe('/feed');
    });

    it('o input logado=false esconde Sair mesmo havendo token', () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, 'token-falso');
      criar(false);
      expect(seletor('.painel-sair')).toBeNull();
      expect(seletor('.painel-entrar')).toBeTruthy();
    });

    it('clicar em Sair emite o output sair uma vez', () => {
      criar(true);
      const emitidos: unknown[] = [];
      fixture.componentInstance.sair.subscribe((valor) => emitidos.push(valor));

      seletor('.painel-sair')?.click();

      expect(emitidos.length).toBe(1);
    });
  });

  describe('botão de tema', () => {
    it('começa com aria-label descritivo e aria-pressed="false" no tema escuro', () => {
      criar();
      const botao = seletor('.painel-tema');

      expect(botao?.getAttribute('aria-label')).toBe('Usar tema claro');
      expect(botao?.getAttribute('aria-pressed')).toBe('false');
      expect(botao?.querySelector('i')?.classList.contains('pi-moon')).toBe(true);
      expect(botao?.querySelector('i')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('alterna o tema, atualiza aria-pressed e o ícone, e aplica data-theme', () => {
      criar();
      const botao = seletor('.painel-tema');

      botao?.click();
      fixture.detectChanges();

      expect(botao?.getAttribute('aria-pressed')).toBe('true');
      expect(botao?.querySelector('i')?.classList.contains('pi-sun')).toBe(true);
      expect(document.documentElement.dataset['theme']).toBe('light');
      expect(localStorage.getItem(TEMA_STORAGE_KEY)).toBe('claro');

      botao?.click();
      fixture.detectChanges();

      expect(botao?.getAttribute('aria-pressed')).toBe('false');
      expect(botao?.querySelector('i')?.classList.contains('pi-moon')).toBe(true);
      expect(document.documentElement.dataset['theme']).toBe('dark');
    });

    it('começa pressionado quando o tema salvo é o claro', () => {
      localStorage.setItem(TEMA_STORAGE_KEY, 'claro');
      criar();

      expect(seletor('.painel-tema')?.getAttribute('aria-pressed')).toBe('true');
    });
  });
});
