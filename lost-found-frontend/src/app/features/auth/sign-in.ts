import { Component, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UNIVERSITY_DOMAIN } from '../../core/auth/auth.service';
import { Logo } from '../../shared/ui/logo';

/**
 * Sign in (M1): university email, then a 6-digit code.
 * Demo: any @kbtu.kz address and any 6 digits work.
 */
@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, Logo],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  /** ?next=/item/0412 — where to go after signing in (set by authGuard). */
  readonly next = input<string>();

  protected readonly domain = UNIVERSITY_DOMAIN;
  protected readonly step = signal<'email' | 'code'>('email');
  protected readonly error = signal('');

  /** Only the part before "@kbtu.kz"; the suffix is shown muted, as in the design. */
  protected readonly emailForm = this.fb.group({
    login: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
  });
  protected readonly login = toSignal(this.emailForm.controls.login.valueChanges, {
    initialValue: '',
  });
  protected readonly codeForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  protected readonly demoUsers = [
    { login: 'a_seitkali', name: 'Aruzhan' },
    { login: 'd_kassym', name: 'Daniyar' },
  ];

  protected get email(): string {
    return `${this.emailForm.controls.login.value.trim().toLowerCase()}${this.domain}`;
  }

  protected useDemo(login: string): void {
    this.emailForm.setValue({ login });
    this.continue();
  }

  protected continue(): void {
    this.error.set('');
    if (this.emailForm.invalid || !this.auth.requestCode(this.email)) {
      this.error.set('Use your KBTU login, e.g. a_seitkali');
      return;
    }
    this.step.set('code');
  }

  protected verify(): void {
    this.error.set('');
    const user =
      this.codeForm.valid && this.auth.verifyCode(this.email, this.codeForm.getRawValue().code);
    if (!user) {
      this.error.set('Enter the 6 digits from the email (any 6 digits in the demo).');
      return;
    }
    const next = this.next();
    this.router.navigateByUrl(next?.startsWith('/') ? next : '/');
  }

  protected back(): void {
    this.step.set('email');
    this.codeForm.reset();
    this.error.set('');
  }
}
