export interface Post {
  id: number;
  titulo: string;
  resumo: string;
  categoria: string;
  autor: string;
  criadoEm: string; // ISO string — formatado no template via pipe
  score: number;
  totalComentarios: number;
  votadoPeloUsuario: boolean;
}
