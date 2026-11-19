import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { PostCardComponent } from './post';
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

  it('mostra o título como heading, a contagem do upvote e o badge de categoria', () => {
    expect(seletor('h2.post-title')?.textContent).toContain('Título de teste');
    expect(seletor('.upvote-btn')?.textContent).toContain('▲');
    expect(seletor('.score')?.textContent?.trim()).toBe('3');
    expect(seletor('.categoria-badge')?.textContent).toContain('Distros');
  });

  it('reflete o voto do usuário em aria-pressed e na classe votado', async () => {
    expect(seletor('.upvote-btn')?.getAttribute('aria-pressed')).toBe('false');

    fixture.componentRef.setInput('post', { ...postDeTeste, votadoPeloUsuario: true });
    await fixture.whenStable();

    expect(seletor('.upvote-btn')?.getAttribute('aria-pressed')).toBe('true');
    expect(seletor('.upvote-btn')?.classList.contains('votado')).toBe(true);
  });
});
