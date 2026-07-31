import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { InicioComponent } from './inicio/inicio';
import { CadastroComponent } from './cadastro/cadastro';

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
