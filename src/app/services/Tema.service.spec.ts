import { TestBed } from '@angular/core/testing';

import { TEMA_STORAGE_KEY, TemaService } from './Tema.service';

describe('TemaService', () => {
  const temaNoHtml = (): string | undefined => document.documentElement.dataset['theme'];

  const simularPreferenciaClara = (clara: boolean): void => {
    vi.stubGlobal('matchMedia', (consulta: string) => ({
      matches: clara && consulta.includes('light'),
      media: consulta,
    }));
  };

  const criar = (): TemaService => TestBed.inject(TemaService);

  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
    simularPreferenciaClara(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  it('usa o tema escuro por padrão e aplica data-theme="dark" ao instanciar', () => {
    const servico = criar();

    expect(servico.tema()).toBe('escuro');
    expect(temaNoHtml()).toBe('dark');
  });

  it('segue prefers-color-scheme: light quando não há valor salvo', () => {
    simularPreferenciaClara(true);

    const servico = criar();

    expect(servico.tema()).toBe('claro');
    expect(temaNoHtml()).toBe('light');
  });

  it('não persiste a preferência do sistema enquanto o usuário não alternar', () => {
    simularPreferenciaClara(true);
    criar();

    expect(localStorage.getItem(TEMA_STORAGE_KEY)).toBeNull();
  });

  it('restaura o valor salvo, mesmo contra a preferência do sistema', () => {
    simularPreferenciaClara(true);
    localStorage.setItem(TEMA_STORAGE_KEY, 'escuro');

    const servico = criar();

    expect(servico.tema()).toBe('escuro');
    expect(temaNoHtml()).toBe('dark');
  });

  it('ignora um valor salvo inválido', () => {
    localStorage.setItem(TEMA_STORAGE_KEY, 'roxo');

    const servico = criar();

    expect(servico.tema()).toBe('escuro');
    expect(temaNoHtml()).toBe('dark');
  });

  it('alternar troca o tema, aplica data-theme e persiste', () => {
    const servico = criar();

    servico.alternar();
    expect(servico.tema()).toBe('claro');
    expect(temaNoHtml()).toBe('light');
    expect(localStorage.getItem(TEMA_STORAGE_KEY)).toBe('claro');

    servico.alternar();
    expect(servico.tema()).toBe('escuro');
    expect(temaNoHtml()).toBe('dark');
    expect(localStorage.getItem(TEMA_STORAGE_KEY)).toBe('escuro');
  });

  it('não quebra quando o localStorage lança erro', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage bloqueado');
    });

    const servico = criar();
    expect(servico.tema()).toBe('escuro');

    expect(() => servico.alternar()).not.toThrow();
    expect(servico.tema()).toBe('claro');
    expect(temaNoHtml()).toBe('light');
  });

  it('não quebra quando matchMedia não existe', () => {
    vi.stubGlobal('matchMedia', undefined);

    const servico = criar();

    expect(servico.tema()).toBe('escuro');
    expect(temaNoHtml()).toBe('dark');
  });
});
