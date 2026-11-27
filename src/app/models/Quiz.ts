/** Ids das distros do quiz. Fonte única: o tipo `DistroId` deriva desta lista. */
export const IDS_DISTRO = ['mint', 'ubuntu', 'fedora', 'debian', 'arch', 'manjaro', 'popos'] as const;

export type DistroId = (typeof IDS_DISTRO)[number];

/** Pontos que uma opção soma a cada distro (ausente = 0). */
export type PontosPorDistro = Partial<Record<DistroId, number>>;

export interface Opcao {
  rotulo: string;
  pontos: PontosPorDistro;
}

export interface Pergunta {
  texto: string;
  opcoes: readonly Opcao[];
}

/** Trecho de texto; `destaque` marca o trecho em negrito (substitui o HTML com <b> do protótipo). */
export interface SegmentoTexto {
  texto: string;
  destaque?: boolean;
}

export interface Distro {
  id: DistroId;
  nome: string;
  tag: string;
  base: string;
  pacotes: string;
  desktop: string;
  porque: readonly SegmentoTexto[];
  link: string;
}

export const PERGUNTAS: readonly Pergunta[] = [
  {
    texto: 'Qual seu nível de experiência com Linux?',
    opcoes: [
      { rotulo: 'Nunca usei, é a primeira vez', pontos: { mint: 3, popos: 2, ubuntu: 2 } },
      { rotulo: 'Já mexi um pouco, sei o básico de terminal', pontos: { ubuntu: 3, fedora: 2, mint: 1 } },
      { rotulo: 'Uso há tempos, gosto de configurar as coisas', pontos: { fedora: 3, debian: 2, manjaro: 2 } },
      { rotulo: 'Sou avançado, quero controle total do sistema', pontos: { arch: 4, debian: 2 } },
    ],
  },
  {
    texto: 'O que mais importa pra você em um sistema?',
    opcoes: [
      { rotulo: 'Estabilidade acima de tudo, odeio surpresas', pontos: { debian: 4, mint: 2 } },
      { rotulo: 'Ter sempre os pacotes e versões mais novas', pontos: { arch: 3, fedora: 3, manjaro: 2 } },
      { rotulo: 'Equilíbrio entre novidade e estabilidade', pontos: { fedora: 3, ubuntu: 2, popos: 2 } },
      { rotulo: 'Não pensar nisso, só quero que funcione', pontos: { mint: 3, ubuntu: 2, popos: 1 } },
    ],
  },
  {
    texto: 'Pra que você vai usar principalmente?',
    opcoes: [
      { rotulo: 'Trabalho e desenvolvimento no dia a dia', pontos: { fedora: 3, ubuntu: 2, popos: 2 } },
      { rotulo: 'Jogos, com placa de vídeo dedicada', pontos: { popos: 4, manjaro: 2 } },
      { rotulo: 'Servidor, estudo de infra ou homelab', pontos: { debian: 4, ubuntu: 1 } },
      { rotulo: 'Só quero conhecer Linux e usar no dia a dia', pontos: { mint: 4, ubuntu: 1 } },
    ],
  },
  {
    texto: 'Quanto tempo você topa gastar configurando o sistema?',
    opcoes: [
      { rotulo: 'Zero. Instalei, já quero trabalhar', pontos: { mint: 3, popos: 3, ubuntu: 2 } },
      { rotulo: 'Um pouco, não me incomodo de ajustar coisas', pontos: { fedora: 2, ubuntu: 2, manjaro: 2 } },
      { rotulo: 'Bastante — pra mim, configurar é parte da graça', pontos: { arch: 4, debian: 1 } },
    ],
  },
  {
    texto: 'Como é o seu hardware?',
    opcoes: [
      { rotulo: 'Notebook novo, com GPU NVIDIA dedicada', pontos: { popos: 3, fedora: 1 } },
      { rotulo: 'PC ou notebook comum, sem nada exótico', pontos: { ubuntu: 2, mint: 2, fedora: 2 } },
      { rotulo: 'Máquina mais antiga ou com pouco recurso', pontos: { debian: 3, mint: 2 } },
      {
        rotulo: 'Monto/formato máquinas com frequência, hardware variado',
        pontos: { arch: 2, manjaro: 2, fedora: 2 },
      },
    ],
  },
  {
    texto: 'Se o sistema quebrar numa atualização, às 2h da manhã...',
    opcoes: [
      { rotulo: 'Entro em pânico. Preciso que isso nunca aconteça', pontos: { debian: 3, mint: 3 } },
      { rotulo: 'Xingo um pouco, pesquiso e resolvo — faz parte', pontos: { fedora: 2, manjaro: 2, ubuntu: 1 } },
      { rotulo: 'Provavelmente fui eu que causei, sei consertar', pontos: { arch: 4 } },
    ],
  },
  {
    texto: 'Que tipo de comunidade e suporte você prefere?',
    opcoes: [
      { rotulo: 'Quero um app store visual, tipo loja de apps', pontos: { mint: 2, ubuntu: 2, popos: 2 } },
      { rotulo: 'Documentação técnica excelente, aprendo lendo', pontos: { arch: 4, debian: 2 } },
      { rotulo: 'Fórum ativo, próximo da comunidade de devs', pontos: { fedora: 3, ubuntu: 2 } },
      { rotulo: 'Tanto faz, eu resolvo sozinho no terminal', pontos: { debian: 2, arch: 2, manjaro: 1 } },
    ],
  },
];

export const DISTROS: Readonly<Record<DistroId, Distro>> = {
  mint: {
    id: 'mint',
    nome: 'Linux Mint',
    tag: 'baseado em Ubuntu · desktop Cinnamon',
    base: 'Ubuntu / Debian',
    pacotes: 'apt (.deb)',
    desktop: 'Cinnamon',
    porque: [
      { texto: 'Você quer algo que ' },
      { texto: 'simplesmente funcione', destaque: true },
      {
        texto:
          ', sem curva de aprendizado. Mint entrega uma interface familiar (parecida com Windows), estabilidade e zero necessidade de tocar no terminal no dia a dia.',
      },
    ],
    link: 'https://linuxmint.com/download.php',
  },
  ubuntu: {
    id: 'ubuntu',
    nome: 'Ubuntu',
    tag: 'baseado em Debian · desktop GNOME',
    base: 'Debian',
    pacotes: 'apt (.deb) + snap',
    desktop: 'GNOME',
    porque: [
      { texto: 'Equilíbrio entre ' },
      { texto: 'facilidade e ecossistema maduro', destaque: true },
      {
        texto:
          '. É o Linux com mais tutoriais, mais compatibilidade de software e o padrão de fato no mercado de trabalho e em servidores.',
      },
    ],
    link: 'https://ubuntu.com/download/desktop',
  },
  fedora: {
    id: 'fedora',
    nome: 'Fedora Workstation',
    tag: 'upstream do RHEL · desktop GNOME',
    base: 'independente (RPM)',
    pacotes: 'dnf (.rpm)',
    desktop: 'GNOME',
    porque: [
      { texto: 'Você quer ficar ' },
      { texto: 'perto do que há de mais novo', destaque: true },
      {
        texto:
          ' sem virar caçador de bugs full-time. Fedora é atualizado, tecnicamente sólido e é onde boa parte das novidades do kernel e do GNOME estreiam primeiro.',
      },
    ],
    link: 'https://fedoraproject.org/workstation/download',
  },
  debian: {
    id: 'debian',
    nome: 'Debian',
    tag: 'a base de tudo · estável por natureza',
    base: 'independente (.deb)',
    pacotes: 'apt (.deb)',
    desktop: 'sua escolha na instalação',
    porque: [
      { texto: 'Para você, ' },
      { texto: 'estabilidade não é negociável', destaque: true },
      {
        texto:
          '. Debian muda pouco, quebra raramente, e é a fundação sobre a qual Ubuntu e Mint são construídos — ótimo pra servidor, homelab ou desktop que precisa simplesmente não parar.',
      },
    ],
    link: 'https://www.debian.org/distrib/',
  },
  arch: {
    id: 'arch',
    nome: 'Arch Linux',
    tag: 'minimalista · você monta cada peça',
    base: 'independente (pacman)',
    pacotes: 'pacman + AUR',
    desktop: 'nenhum por padrão — você escolhe',
    porque: [
      { texto: 'Você quer ' },
      { texto: 'entender e controlar cada parte', destaque: true },
      {
        texto:
          ' do sistema. Arch não instala nada que você não pediu, tem a melhor documentação técnica do ecossistema (ArchWiki) e recompensa quem gosta de configurar do zero.',
      },
    ],
    link: 'https://archlinux.org/download/',
  },
  manjaro: {
    id: 'manjaro',
    nome: 'Manjaro',
    tag: 'Arch, com trilhos de segurança',
    base: 'Arch Linux',
    pacotes: 'pacman + AUR',
    desktop: 'XFCE / KDE / GNOME',
    porque: [
      { texto: 'Você quer o ' },
      { texto: 'poder do Arch', destaque: true },
      { texto: ' (pacotes recentes, AUR, customização) ' },
      { texto: 'sem montar tudo do zero', destaque: true },
      {
        texto:
          '. Manjaro testa os pacotes antes de liberar e já vem instalador gráfico e drivers configurados.',
      },
    ],
    link: 'https://manjaro.org/download/',
  },
  popos: {
    id: 'popos',
    nome: 'Pop!_OS',
    tag: 'da System76 · foco em produtividade e jogos',
    base: 'Ubuntu',
    pacotes: 'apt (.deb) + Flatpak',
    // Protótipo dizia "COSMIC / GNOME modificado"; as versões atuais (24.04 em diante) usam COSMIC.
    desktop: 'COSMIC',
    porque: [
      { texto: 'Prioridade em ' },
      { texto: 'drivers NVIDIA prontos', destaque: true },
      {
        texto:
          ', gerenciamento de janelas por tiling nativo e uma experiência polida pra quem joga e também trabalha na mesma máquina.',
      },
    ],
    link: 'https://pop.system76.com/',
  },
};
