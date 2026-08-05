import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { InicioComponent } from './pages/inicio/inicio';
import { CadastroComponent } from './pages/cadastro/cadastro';

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
  }
];
