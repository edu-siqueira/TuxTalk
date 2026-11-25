import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { PostCardComponent, formatarDataRelativa } from './post';
import { Post } from '../../models/Post';

const postDeTeste: Post = {
  id: 1,
  titulo: 'Título de teste',
  resumo: 'Resumo de teste',
  categoria: 'Distros',
  autor: 'tux',
  criadoEm: '2026-01-01T12:00:00Z',
  score: 3,
  totalComentarios: 0,
  votadoPeloUsuario: false,
};

describe('PostCardComponent', () => {
  let component: PostCardComponent;
  let fixture: ComponentFixture<PostCardComponent>;

  const seletor = (css: string): HTMLElement | null =>
    (fixture.nativeElement as HTMLElement).querySelector(css);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostCardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(PostCardComponent);
    fixture.componentRef.setInput('post', postDeTeste);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit the post id on upvote click', () => {
    const emitidos: number[] = [];
    component.upvote.subscribe((id: number) => emitidos.push(id));

    seletor('.upvote-btn')?.click();

    expect(emitidos).toEqual([1]);
  });

  it('mostra o card dentro de uma janela com o caminho da categoria na barra de título', () => {
    expect(seletor('app-janela')).toBeTruthy();
    expect(seletor('.janela-titulo')?.textContent).toContain('~/distros/');
  });

  it('mostra o título como heading e a contagem do upvote', () => {
    expect(seletor('h2.post-title')?.textContent).toContain('Título de teste');
    expect(seletor('.upvote-btn')?.textContent).toContain('▲');
    expect(seletor('.score')?.textContent?.trim()).toBe('3');
  });

  it('não repete informação: categoria só no caminho e autor só na linha de meta', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(seletor('.categoria-badge')).toBeNull();
    expect(seletor('.janela-prompt')).toBeNull();
    expect(seletor('.janela-titulo')?.textContent).toContain('~/distros/');
    expect(seletor('.post-meta .post-autor')?.textContent?.trim()).toBe('tux');
    expect(texto.match(/tux/g)?.length).toBe(1); // o autor aparece uma vez só
    expect(texto.match(/distros/gi)?.length).toBe(1); // a categoria, também
  });

  it('reflete o voto do usuário em aria-pressed e na classe votado', async () => {
    expect(seletor('.upvote-btn')?.getAttribute('aria-pressed')).toBe('false');

    fixture.componentRef.setInput('post', { ...postDeTeste, votadoPeloUsuario: true });
    await fixture.whenStable();

    expect(seletor('.upvote-btn')?.getAttribute('aria-pressed')).toBe('true');
    expect(seletor('.upvote-btn')?.classList.contains('votado')).toBe(true);
  });

  it('dá ao upvote um nome que identifica o post e a contagem', async () => {
    expect(seletor('.upvote-btn')?.getAttribute('aria-label')).toBe('Votar em “Título de teste”, 3 votos');

    fixture.componentRef.setInput('post', { ...postDeTeste, score: 1 });
    await fixture.whenStable();
    expect(seletor('.upvote-btn')?.getAttribute('aria-label')).toBe('Votar em “Título de teste”, 1 voto');
  });

  it('mostra a data em português, com a data completa no title', () => {
    const tempo = seletor('time.post-data');
    expect(tempo?.getAttribute('datetime')).toBe('2026-01-01T12:00:00Z');
    expect(tempo?.getAttribute('title')).toContain('de janeiro de 2026');
    expect(tempo?.textContent).not.toMatch(/AM|PM/);
  });

  it('anuncia os comentários com plural correto', async () => {
    expect(seletor('.comentarios .visually-hidden')?.textContent).toBe('0 comentários');
    fixture.componentRef.setInput('post', { ...postDeTeste, totalComentarios: 1 });
    await fixture.whenStable();
    expect(seletor('.comentarios .visually-hidden')?.textContent).toBe('1 comentário');
  });
});

describe('formatarDataRelativa', () => {
  const agora = new Date('2026-11-19T12:00:00Z').getTime();
  const antes = (segundos: number): string => new Date(agora - segundos * 1000).toISOString();

  it('formata intervalos em português', () => {
    expect(formatarDataRelativa(antes(10), agora)).toBe('agora há pouco');
    expect(formatarDataRelativa(antes(5 * 60), agora)).toBe('há 5 minutos');
    expect(formatarDataRelativa(antes(3 * 3600), agora)).toBe('há 3 horas');
    expect(formatarDataRelativa(antes(24 * 3600), agora)).toBe('ontem');
    expect(formatarDataRelativa(antes(20 * 24 * 3600), agora)).toBe('há 2 semanas');
    expect(formatarDataRelativa(antes(400 * 24 * 3600), agora)).toBe('ano passado');
  });

  it('devolve vazio para data inválida', () => {
    expect(formatarDataRelativa('não é data', agora)).toBe('');
  });
});
