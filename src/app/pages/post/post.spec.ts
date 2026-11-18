import { ComponentFixture, TestBed } from '@angular/core/testing';

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostCardComponent],
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

    const botao = (fixture.nativeElement as HTMLElement).querySelector('.upvote-btn') as HTMLButtonElement;
    botao.click();

    expect(emitidos).toEqual([1]);
  });
});
