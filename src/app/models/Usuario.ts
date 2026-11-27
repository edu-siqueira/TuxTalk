export interface PerfilUsuario {
  username: string;
  criadoEm: string; // ISO string
  bio: string | null;
  avatarUrl: string | null;
  totalPosts: number;
  totalUpvotesRecebidos: number;
  /** Só vem preenchido quando o perfil é do próprio usuário logado. */
  email: string | null;
  /** true quando o perfil pertence a quem está logado. */
  proprio: boolean;
}

export interface AtualizarPerfilPayload {
  bio: string | null;
  avatarUrl: string | null;
}
