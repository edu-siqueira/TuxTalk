import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';

import { QuizComponent } from './quiz';
import { PERGUNTAS } from '../../models/Quiz';
import { AuthService, TOKEN_STORAGE_KEY } from '../../services/Auth.service';

describe('QuizComponent', () => {
  let fixture: ComponentFixture<QuizComponent>;
  let component: QuizComponent;

  const raiz = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const q = <T extends HTMLElement = HTMLElement>(css: string): T | null => raiz().querySelector<T>(css);
  const todos = (css: string): HTMLElement[] => Array.from(raiz().querySelectorAll<HTMLElement>(css));
  const opcoes = (): HTMLButtonElement[] => todos('.quiz-opcao') as HTMLButtonElement[];

  const atualizar = async (): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  /** Clica na opção `j` da pergunta atual. */
  const clicar = async (j: number): Promise<void> => {
    opcoes()[j].click();
    await atualizar();
  };

  const iniciar = async (): Promise<void> => {
    q<HTMLButtonElement>('.quiz-intro .quiz-botao')?.click();
    await atualizar();
  };

  const tecla = (key: string, init: KeyboardEventInit = {}, alvo: EventTarget = document): KeyboardEvent => {
    const evento = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    alvo.dispatchEvent(evento);
    return evento;
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [QuizComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(QuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('estrutura da página', () => {
    it('renderiza o painel, a janela e um único h1', () => {
      expect(q('app-painel')).toBeTruthy();
      expect(q('app-janela')).toBeTruthy();
      expect(todos('h1').length).toBe(1);
    });

    it('deslogado: o painel mostra Entrar e Criar conta', () => {
      expect(q('.painel-entrar')).toBeTruthy();
      expect(q('.painel-criar')).toBeTruthy();
      expect(q('.painel-sair')).toBeNull();
    });

    it('logado: o painel mostra Sair e o logout leva ao login', () => {
      localStorage.setItem(TOKEN_STORAGE_KEY, 'token-falso');
      fixture = TestBed.createComponent(QuizComponent);
      fixture.detectChanges();
      expect(q('.painel-sair')).toBeTruthy();

      const authService = TestBed.inject(AuthService);
      const logout = vi.spyOn(authService, 'logout');
      const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      q<HTMLButtonElement>('.painel-sair')?.click();

      expect(logout).toHaveBeenCalled();
      expect(navegar).toHaveBeenCalledWith(['/login']);
    });

    it('define o título da aba e o restaura ao sair', () => {
      const titulo = TestBed.inject(Title);
      expect(titulo.getTitle()).toBe('Descubra sua distro · TuxTalk');
      fixture.destroy();
      expect(titulo.getTitle()).toBe('TuxTalk');
    });
  });

  describe('intro', () => {
    it('começa na intro, sem perguntas nem resultado', () => {
      expect(component.tela()).toBe('intro');
      expect(q('.quiz-intro')).toBeTruthy();
      expect(q('.quiz-intro-texto')?.textContent).toContain('7 perguntas');
      expect(opcoes().length).toBe(0);
      expect(q('.quiz-resultado')).toBeNull();
      expect(q('[role="status"]')?.textContent?.trim()).toBe('');
    });

    it('iniciar mostra a pergunta 1 e leva o foco ao título', async () => {
      await iniciar();

      expect(component.tela()).toBe('pergunta');
      expect(component.indice()).toBe(0);
      expect(q('.quiz-titulo')?.textContent).toContain(PERGUNTAS[0].texto);
      expect(document.activeElement).toBe(q('.quiz-titulo'));
    });
  });

  describe('pergunta', () => {
    beforeEach(iniciar);

    it('mostra as opções com as teclas 1 a 4 reais', () => {
      expect(opcoes().map((o) => o.querySelector('.quiz-tecla')?.textContent?.trim())).toEqual([
        '1',
        '2',
        '3',
        '4',
      ]);
      expect(opcoes().map((o) => o.getAttribute('aria-keyshortcuts'))).toEqual(['1', '2', '3', '4']);
      expect(opcoes()[0].textContent).toContain(PERGUNTAS[0].opcoes[0].rotulo);
    });

    it('a pergunta com 3 opções mostra só as teclas 1 a 3', async () => {
      for (let i = 0; i < 3; i++) {
        await clicar(0);
      }
      expect(component.indice()).toBe(3);
      expect(opcoes().length).toBe(3);
      expect(opcoes().map((o) => o.querySelector('.quiz-tecla')?.textContent?.trim())).toEqual([
        '1',
        '2',
        '3',
      ]);
    });

    it('a barra de progresso expõe role=progressbar com valor e texto', async () => {
      const barra = q('[role="progressbar"]');
      expect(barra?.getAttribute('aria-valuemin')).toBe('1');
      expect(barra?.getAttribute('aria-valuemax')).toBe('7');
      expect(barra?.getAttribute('aria-valuenow')).toBe('1');
      expect(barra?.getAttribute('aria-valuetext')).toBe('Pergunta 1 de 7');
      expect(todos('.quiz-progresso-segmento.concluido').length).toBe(1);

      await clicar(0);
      expect(barra?.getAttribute('aria-valuenow')).toBe('2');
      expect(barra?.getAttribute('aria-valuetext')).toBe('Pergunta 2 de 7');
      expect(todos('.quiz-progresso-segmento.concluido').length).toBe(2);
    });

    it('responder avança, anuncia a nova pergunta e move o foco para o título', async () => {
      await clicar(1);

      expect(component.indice()).toBe(1);
      expect(q('.quiz-titulo')?.textContent).toContain(PERGUNTAS[1].texto);
      expect(document.activeElement).toBe(q('.quiz-titulo'));
      const status = q('[role="status"]');
      expect(status?.getAttribute('aria-live')).toBe('polite');
      expect(status?.textContent?.trim()).toBe('Pergunta 2 de 7');
    });

    it('não mostra "Voltar" na primeira pergunta', () => {
      expect(q('.quiz-rodape .quiz-botao')).toBeNull();
    });
  });

  describe('voltar', () => {
    beforeEach(iniciar);

    it('volta para a pergunta anterior preservando as respostas', async () => {
      await clicar(2);
      await clicar(1);
      expect(component.indice()).toBe(2);

      q<HTMLButtonElement>('.quiz-rodape .quiz-botao')?.click();
      await atualizar();

      expect(component.indice()).toBe(1);
      expect(component.respostas()).toEqual([2, 1]);
      expect(opcoes()[1].classList.contains('selecionada')).toBe(true);
      expect(opcoes()[1].getAttribute('aria-pressed')).toBe('true');
      expect(todos('.quiz-opcao.selecionada').length).toBe(1);
      expect(document.activeElement).toBe(q('.quiz-titulo'));
    });

    it('mudar uma resposta ao voltar mantém as seguintes', async () => {
      await clicar(0);
      await clicar(0);
      component.voltar();
      component.voltar();
      await atualizar();
      expect(component.indice()).toBe(0);

      await clicar(3); // troca só a resposta da pergunta 1

      expect(component.respostas()).toEqual([3, 0]);
      expect(component.indice()).toBe(1);
      expect(opcoes()[0].classList.contains('selecionada')).toBe(true);
    });
  });

  describe('resultado', () => {
    // Perfil "mint": ver Quiz.service.spec.ts.
    const responderTudo = async (respostas: number[]): Promise<void> => {
      await iniciar();
      for (const j of respostas) {
        await clicar(j);
      }
    };

    it('mostra nome, tag, campos, por quê, segunda colocada e link externo seguro', async () => {
      await responderTudo([0, 3, 3, 0, 1, 0, 0]);

      expect(component.tela()).toBe('resultado');
      expect(q('.quiz-distro-nome')?.textContent).toContain('Linux Mint');
      expect(q('.quiz-distro-tag')?.textContent).toContain('Cinnamon');
      const campos = todos('.quiz-campo').map((c) => [
        c.querySelector('dt')?.textContent?.trim(),
        c.querySelector('dd')?.textContent?.trim(),
      ]);
      expect(campos).toEqual([
        ['base:', 'Ubuntu / Debian'],
        ['pacotes:', 'apt (.deb)'],
        ['desktop:', 'Cinnamon'],
      ]);
      expect(q('.quiz-porque')?.textContent).toContain('Você quer algo que simplesmente funcione, sem curva');
      expect(q('.quiz-porque strong.quiz-destaque')?.textContent).toBe('simplesmente funcione');
      expect(q('.quiz-segunda')?.textContent).toContain('quase foi');
      expect(q('.quiz-segunda-nome')?.textContent).toBe('Ubuntu');

      const link = q<HTMLAnchorElement>('.quiz-acoes a');
      expect(link?.getAttribute('href')).toBe('https://linuxmint.com/download.php');
      expect(link?.getAttribute('target')).toBe('_blank');
      expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('anuncia o resultado e move o foco para o nome da distro', async () => {
      await responderTudo([2, 0, 2, 1, 2, 0, 3]);

      expect(q('.quiz-distro-nome')?.textContent).toContain('Debian');
      expect(document.activeElement).toBe(q('.quiz-distro-nome'));
      expect(q('[role="status"]')?.textContent?.trim()).toBe('Resultado pronto: Debian');
    });

    it('o resultado vem só das respostas (computed), sem score acumulado', async () => {
      await responderTudo([3, 1, 0, 2, 3, 2, 1]);
      expect(component.resultado().vencedora.id).toBe('arch');
      expect(component.ranking()[0].pontos).toBe(21);

      component.voltar();
      await atualizar();
      await clicar(0); // troca a última resposta: perde os 4 pontos do Arch nessa pergunta
      expect(component.respostas()).toEqual([3, 1, 0, 2, 3, 2, 0]);
      expect(component.ranking()[0].pontos).toBe(17);
      expect(component.resultado().vencedora.id).toBe('arch');
    });

    it('voltar no resultado reabre a última pergunta com a resposta marcada', async () => {
      await responderTudo([0, 3, 3, 0, 1, 0, 2]);
      q<HTMLButtonElement>('.quiz-acoes button')?.click();
      await atualizar();

      expect(component.tela()).toBe('pergunta');
      expect(component.indice()).toBe(6);
      expect(component.respostas().length).toBe(7);
      expect(opcoes()[2].classList.contains('selecionada')).toBe(true);
    });

    it('refazer zera as respostas e volta para a intro', async () => {
      await responderTudo([0, 3, 3, 0, 1, 0, 0]);
      const botoes = todos('.quiz-acoes button');
      botoes[botoes.length - 1].click();
      await atualizar();

      expect(component.tela()).toBe('intro');
      expect(component.respostas()).toEqual([]);
      expect(component.indice()).toBe(0);
      expect(q('.quiz-resultado')).toBeNull();
      expect(document.activeElement).toBe(q('.quiz-titulo'));

      await iniciar();
      expect(component.indice()).toBe(0);
      expect(todos('.quiz-opcao.selecionada').length).toBe(0);
    });
  });

  describe('atalhos de teclado', () => {
    it('ignora as teclas na intro', () => {
      const evento = tecla('1');
      expect(component.tela()).toBe('intro');
      expect(component.respostas()).toEqual([]);
      expect(evento.defaultPrevented).toBe(false);
    });

    it('1 a 4 escolhem a opção correspondente', async () => {
      await iniciar();

      tecla('2');
      await atualizar();
      tecla('4');
      await atualizar();
      tecla('1');
      await atualizar();

      expect(component.respostas()).toEqual([1, 3, 0]);
      expect(component.indice()).toBe(3);
    });

    it('a tecla pressionada é a mesma exibida no botão', async () => {
      await iniciar();
      const teclaDoBotao = opcoes()[2].querySelector('.quiz-tecla')?.textContent?.trim() ?? '';
      const evento = tecla(teclaDoBotao);
      await atualizar();

      expect(component.respostas()).toEqual([2]);
      expect(evento.defaultPrevented).toBe(true);
    });

    it('ignora teclas sem opção correspondente (4 na pergunta de 3 opções) e outras teclas', async () => {
      await iniciar();
      for (let i = 0; i < 3; i++) {
        await clicar(0);
      }
      expect(opcoes().length).toBe(3);

      tecla('4');
      tecla('0');
      tecla('a');
      tecla('Enter');
      await atualizar();

      expect(component.respostas().length).toBe(3);
      expect(component.indice()).toBe(3);
    });

    it('ignora com modificadores', async () => {
      await iniciar();

      tecla('1', { ctrlKey: true });
      tecla('1', { altKey: true });
      tecla('1', { metaKey: true });
      tecla('1', { shiftKey: true });
      await atualizar();

      expect(component.respostas()).toEqual([]);
    });

    it('ignora quando o foco está num campo de texto', async () => {
      await iniciar();
      const campo = document.createElement('input');
      document.body.appendChild(campo);
      campo.focus();

      const evento = tecla('1', {}, campo);
      await atualizar();

      expect(component.respostas()).toEqual([]);
      expect(evento.defaultPrevented).toBe(false);
      campo.remove();
    });

    it('ignora no resultado', async () => {
      await iniciar();
      for (let i = 0; i < 7; i++) {
        await clicar(0);
      }
      expect(component.tela()).toBe('resultado');

      tecla('1');
      await atualizar();

      expect(component.tela()).toBe('resultado');
      expect(component.respostas().length).toBe(7);
    });
  });
});
