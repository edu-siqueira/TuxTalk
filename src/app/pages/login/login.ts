import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';

import { AuthService } from '../../services/Auth.service';

import * as AOS from 'aos';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    DividerModule,
    MessageModule,
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  carregando = false;
  erroLogin: string | null = null;

  ngOnInit() {
    AOS.init({
      duration: 1200,
      once: true
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      AOS.refresh();
    }, 100);
  }

  form = this.fb.nonNullable.group({
    identificador: ['', [Validators.required]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  get identificador() {
    return this.form.controls.identificador;
  }

  get senha() {
    return this.form.controls.senha;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.erroLogin = null;
    this.carregando = true;

    const { identificador, senha } = this.form.getRawValue();

    this.authService.login(identificador, senha).subscribe({
      next: () => {
        this.carregando = false;
        this.router.navigateByUrl('/feed');
      },
      error: () => {
        this.carregando = false;
        this.erroLogin = 'Usuário ou senha inválidos.';
      },
    });
  }

  onLoginGithub(): void {
    this.authService.redirecionarParaGithub();
  }
}
