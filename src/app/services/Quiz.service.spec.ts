import { DISTROS, DistroId, IDS_DISTRO, Opcao, PERGUNTAS } from '../models/Quiz';
import { ORDEM_DESEMPATE, calcularRanking } from './Quiz.service';

/** Converte índices de opção (um por pergunta) nas opções escolhidas. */
const escolher = (indices: number[]): Opcao[] => indices.map((j, i) => PERGUNTAS[i].opcoes[j]);
const vencedora = (indices: number[]): DistroId => calcularRanking(escolher(indices))[0].id;
const opcao = (pontos: Opcao['pontos']): Opcao => ({ rotulo: 'x', pontos });

describe('calcularRanking', () => {
  describe('cenários típicos', () => {
    const cenarios: [DistroId, string, number[]][] = [
      ['mint', 'iniciante que quer que funcione', [0, 3, 3, 0, 1, 0, 0]],
      ['ubuntu', 'equilíbrio e ecossistema', [1, 3, 0, 1, 1, 1, 0]],
      ['fedora', 'dev que gosta de novidade', [2, 2, 0, 1, 1, 1, 2]],
      ['debian', 'estabilidade e máquina antiga', [2, 0, 2, 1, 2, 0, 3]],
      ['arch', 'avançado que quer controle total', [3, 1, 0, 2, 3, 2, 1]],
      ['manjaro', 'Arch sem montar do zero', [2, 1, 1, 1, 3, 1, 3]],
      ['popos', 'jogos com GPU NVIDIA', [0, 2, 1, 0, 0, 1, 0]],
    ];

    it.each(cenarios)('%s: %s', (id, _descricao, respostas) => {
      const ranking = calcularRanking(escolher(respostas));
      expect(ranking[0].id).toBe(id);
      // vence sem depender do desempate
      expect(ranking[0].pontos).toBeGreaterThan(ranking[1].pontos);
    });

    it('cobre todas as distros do quiz', () => {
      expect(cenarios.map(([id]) => id).sort()).toEqual([...IDS_DISTRO].sort());
    });
  });

  it('soma os pontos de cada opção e devolve todas as distros', () => {
    const ranking = calcularRanking(escolher([0, 3, 3, 0, 1, 0, 0]));
    expect(ranking.length).toBe(IDS_DISTRO.length);
    const mint = ranking.find((r) => r.id === 'mint');
    expect(mint?.pontos).toBe(3 + 3 + 4 + 3 + 2 + 3 + 2);
    expect(mint?.pontosIniciais).toBe(3 + 3);
  });

  it('sem respostas, todas zeradas e na ordem fixa de desempate', () => {
    const ranking = calcularRanking([]);
    expect(ranking.every((r) => r.pontos === 0)).toBe(true);
    expect(ranking.map((r) => r.id)).toEqual([...ORDEM_DESEMPATE]);
  });

  it('a ordem fixa lista cada distro exatamente uma vez', () => {
    expect([...ORDEM_DESEMPATE].sort()).toEqual([...IDS_DISTRO].sort());
  });

  describe('desempate', () => {
    it('empate no total: vence quem pontuou mais nas perguntas 1 e 2', () => {
      // arch e mint empatam em 1 ponto; só arch pontuou nas duas primeiras.
      // Pela ordem fixa mint viria antes, então o critério das perguntas iniciais é o que decide.
      const ranking = calcularRanking([opcao({ arch: 1 }), opcao({}), opcao({ mint: 1 })]);
      expect(ranking[0]).toEqual({ id: 'arch', pontos: 1, pontosIniciais: 1 });
      expect(ranking[1]).toEqual({ id: 'mint', pontos: 1, pontosIniciais: 0 });
    });

    it('pontos depois da pergunta 2 não entram no critério das perguntas iniciais', () => {
      const ranking = calcularRanking([opcao({}), opcao({}), opcao({ arch: 5 }), opcao({ mint: 5 })]);
      expect(ranking[0].id).toBe('mint'); // ambos 5/0: decide a ordem fixa (mint antes de arch)
      expect(ranking[1].id).toBe('arch');
    });

    it('persistindo o empate, vale a ordem fixa', () => {
      const ranking = calcularRanking([opcao({ arch: 2, mint: 2, debian: 2 })]);
      expect(ranking.slice(0, 3).map((r) => r.id)).toEqual(['mint', 'debian', 'arch']);
    });

    it('é determinístico: mesmas respostas, mesmo ranking, qualquer ordem das chaves', () => {
      const a = calcularRanking([opcao({ arch: 2, mint: 2 }), opcao({ popos: 1, fedora: 1 })]);
      const b = calcularRanking([opcao({ mint: 2, arch: 2 }), opcao({ fedora: 1, popos: 1 })]);
      expect(a).toEqual(b);
      expect(calcularRanking(escolher([0, 0, 0, 0, 0, 0, 0]))).toEqual(
        calcularRanking(escolher([0, 0, 0, 0, 0, 0, 0])),
      );
    });

    it('não altera a entrada', () => {
      const escolhidas = escolher([0, 1, 2]);
      const copia = structuredClone(escolhidas);
      calcularRanking(escolhidas);
      expect(escolhidas).toEqual(copia);
    });
  });
});

describe('dados do quiz', () => {
  it('tem 7 perguntas com 3 ou 4 opções e só ids de distro válidos', () => {
    expect(PERGUNTAS.length).toBe(7);
    for (const pergunta of PERGUNTAS) {
      expect(pergunta.opcoes.length).toBeGreaterThanOrEqual(3);
      expect(pergunta.opcoes.length).toBeLessThanOrEqual(4);
      for (const o of pergunta.opcoes) {
        Object.keys(o.pontos).forEach((id) => expect(IDS_DISTRO).toContain(id as DistroId));
      }
    }
  });

  it('cada distro tem links https e o texto "por quê" montado dos segmentos', () => {
    for (const id of IDS_DISTRO) {
      const distro = DISTROS[id];
      expect(distro.id).toBe(id);
      expect(distro.link.startsWith('https://')).toBe(true);
      expect(distro.porque.some((s) => s.destaque)).toBe(true);
      expect(distro.porque.map((s) => s.texto).join('')).not.toMatch(/[<>]/);
    }
  });
});
