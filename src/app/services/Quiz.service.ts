import { DistroId, IDS_DISTRO, Opcao } from '../models/Quiz';

/** Quantas perguntas iniciais (experiência e prioridade) entram no primeiro critério de desempate. */
export const PERGUNTAS_DE_DESEMPATE = 2;

/**
 * Último critério de desempate: ordem fixa, da distro mais amigável a quem está começando
 * para a mais exigente. Garante resultado idêntico para as mesmas respostas.
 */
export const ORDEM_DESEMPATE: readonly DistroId[] = [
  'mint',
  'ubuntu',
  'popos',
  'fedora',
  'debian',
  'manjaro',
  'arch',
];

export interface ItemRanking {
  id: DistroId;
  /** Soma dos pontos de todas as respostas. */
  pontos: number;
  /** Pontos vindos só das primeiras `PERGUNTAS_DE_DESEMPATE` respostas. */
  pontosIniciais: number;
}

/**
 * Calcula o ranking das distros a partir das opções escolhidas (a posição no array é o número
 * da pergunta). Função pura: não guarda estado.
 *
 * Critério de ordenação (do mais para o menos importante):
 * 1. maior pontuação total;
 * 2. em empate, mais pontos nas perguntas 1 e 2;
 * 3. persistindo o empate, a posição em `ORDEM_DESEMPATE`.
 */
export function calcularRanking(escolhidas: readonly Opcao[]): ItemRanking[] {
  const ranking = new Map<DistroId, ItemRanking>(
    IDS_DISTRO.map((id) => [id, { id, pontos: 0, pontosIniciais: 0 }]),
  );

  escolhidas.forEach((opcao, indice) => {
    for (const id of IDS_DISTRO) {
      const pontos = opcao.pontos[id] ?? 0;
      const item = ranking.get(id)!;
      item.pontos += pontos;
      if (indice < PERGUNTAS_DE_DESEMPATE) {
        item.pontosIniciais += pontos;
      }
    }
  });

  return [...ranking.values()].sort(
    (a, b) =>
      b.pontos - a.pontos ||
      b.pontosIniciais - a.pontosIniciais ||
      ORDEM_DESEMPATE.indexOf(a.id) - ORDEM_DESEMPATE.indexOf(b.id),
  );
}
