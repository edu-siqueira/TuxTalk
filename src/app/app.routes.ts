import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { InicioComponent } from './pages/inicio/inicio';
import { CadastroComponent } from './pages/cadastro/cadastro';
import { FeedComponent } from './pages/feed/feed';
import { QuizComponent } from './pages/quiz/quiz';
import { PerfilComponent } from './pages/perfil/perfil';
import { perfilRedirectGuard } from './guards/perfil.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full'
  },
  {
    path: 'inicio',
    component: InicioComponent
  },
  {
    path: 'cadastro',
    component: CadastroComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'feed',
    component: FeedComponent
  },
  {
    path: 'quiz',
    component: QuizComponent
  },
  {
    path: 'u/:username',
    component: PerfilComponent
  },
  {
    // Sem tela própria: o guard sempre redireciona (login ou /u/<username>).
    path: 'perfil',
    canActivate: [perfilRedirectGuard],
    children: []
  }
];
