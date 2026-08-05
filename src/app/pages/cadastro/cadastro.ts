import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';

import { AuthService } from '../../services/Auth.service';

import * as AOS from 'aos';

// Validator de grupo: compara senha e confirmarSenha. Fica fora da classe
// porque não depende de estado da instância — evita recriar a função a cada render.
function senhasIguaisValidator(grupo: AbstractControl): ValidationErrors | null {
  const senha = grupo.get('senha')?.value;
  const confirmarSenha = grupo.get('confirmarSenha')?.value;
  return senha === confirmarSenha ? null : { senhasDiferentes: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    DividerModule,
    MessageModule,
  ],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.scss',
})
export class CadastroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  carregando = false;
  erroCadastro: string | null = null;

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

  form = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(8)]],
      confirmarSenha: ['', [Validators.required]],
      aceitaTermos: [false, [Validators.requiredTrue]],
    },
    { validators: senhasIguaisValidator },
  );

  get username() {
    return this.form.controls.username;
  }

  get email() {
    return this.form.controls.email;
  }

  get senha() {
    return this.form.controls.senha;
  }

  get confirmarSenha() {
    return this.form.controls.confirmarSenha;
  }

  get aceitaTermos() {
    return this.form.controls.aceitaTermos;
  }

  get senhasDiferem(): boolean {
    return (
      this.form.hasError('senhasDiferentes') &&
      this.confirmarSenha.touched &&
      this.confirmarSenha.value.length > 0
    );
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.erroCadastro = null;
    this.carregando = true;

    const { username, email, senha } = this.form.getRawValue();

    this.authService.registrar({ username, email, senha }).subscribe({
      next: () => {
        this.carregando = false;
        this.router.navigateByUrl('/feed');
      },
      error: (err) => {
        this.carregando = false;
        this.erroCadastro =
          err?.status === 409
            ? 'Esse usuário ou email já está cadastrado.'
            : 'Não foi possível criar a conta. Tente novamente.';
      },
    });
  }

  onCadastroGithub(): void {
    this.authService.redirecionarParaGithub();
  }

  onCadastroGoogle(): void {
    this.authService.redirecionarParaGoogle();
  }
}
