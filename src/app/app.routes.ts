import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { InicioComponent } from './inicio/inicio';

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
    path: 'login',
    component: LoginComponent
  }
];
