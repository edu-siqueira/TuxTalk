import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { JanelaComponent } from './janela';

@Component({
  standalone: true,
  imports: [JanelaComponent],
  template: `
    <app-janela [titulo]="titulo()" [prompt]="prompt()" [controles]="controles()">
      <p class="conteudo-projetado">Conteúdo da janela</p>
    </app-janela>
  `,
})
class HospedeiroComponent {
  titulo = signal('Autenticação');
  prompt = signal<string | undefined>(undefined);
  controles = signal(false);
}

describe('JanelaComponent', () => {
  let fixture: ComponentFixture<HospedeiroComponent>;
  let hospedeiro: HospedeiroComponent;

  const raiz = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const seletor = (css: string): HTMLElement | null => raiz().querySelector(css);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HospedeiroComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HospedeiroComponent);
    hospedeiro = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renderiza o título na barra', () => {
    expect(seletor('.janela-titulo')?.textContent).toContain('Autenticação');

    hospedeiro.titulo.set('Criar conta');
    fixture.detectChanges();

    expect(seletor('.janela-titulo')?.textContent).toContain('Criar conta');
  });

  it('não renderiza o prompt quando ele não é informado', () => {
    expect(seletor('.janela-prompt')).toBeNull();
  });

  it('renderiza o prompt com a classe .tux-prompt quando informado', () => {
    hospedeiro.prompt.set('tux@tuxtalk:~$');
    fixture.detectChanges();

    const prompt = seletor('.janela-prompt');
    expect(prompt).toBeTruthy();
    expect(prompt?.classList.contains('tux-prompt')).toBe(true);
    expect(prompt?.textContent).toContain('tux@tuxtalk:~$');
  });

  it('projeta o conteúdo no corpo da janela', () => {
    const projetado = seletor('.janela-corpo .conteudo-projetado');
    expect(projetado).toBeTruthy();
    expect(projetado?.textContent).toContain('Conteúdo da janela');
  });

  it('não renderiza os controles por padrão', () => {
    expect(seletor('.janela-controles')).toBeNull();
    expect(raiz().querySelectorAll('.janela-controle').length).toBe(0);
  });

  it('com controles ativo, renderiza os ícones decorativos como aria-hidden e não os torna botões', () => {
    hospedeiro.controles.set(true);
    fixture.detectChanges();

    const controles = seletor('.janela-controles');
    expect(controles?.getAttribute('aria-hidden')).toBe('true');
    expect(controles?.querySelectorAll('.janela-controle').length).toBe(3);
    expect(raiz().querySelectorAll('button, a, [role="button"]').length).toBe(0);
  });
});
