import { Component, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UNIVERSITY_DOMAIN } from '../../core/auth/auth.service';
import { Logo } from '../../shared/ui/logo';

/**
 * Sign in (M1) — US-01.
 *
 * 'msal' mode: one button, "Sign in with Microsoft", using the KBTU account.
 * 'dev' mode:  type a KBTU login; the API trusts it (local development only).
 * Either way the user then lands on the page they asked for (?next=, set by authGuard).
 */
@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule, Logo],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  /** ?next=/item/0412 — where to go after signing in (set by authGuard). */
  readonly next = input<string>();

  protected readonly domain = UNIVERSITY_DOMAIN;
  protected readonly busy = signal(false);
  protected readonly localError = signal('');

  /** Only the part before "@kbtu.kz"; the suffix is shown muted, as in the design. */
  protected readonly emailForm = this.fb.group({
    login: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
  });
  protected readonly login = toSignal(this.emailForm.controls.login.valueChanges, {
    initialValue: '',
  });

  protected readonly demoUsers = [
    { login: 'a_seitkali', name: 'Aruzhan' },
    { login: 'd_kassym', name: 'Daniyar' },
  ];

  protected error(): string {
    return this.localError() || this.auth.error();
  }

  protected get email(): string {
    return `${this.emailForm.controls.login.value.trim().toLowerCase()}${this.domain}`;
  }

  private get returnTo(): string {
    const next = this.next();
    return next?.startsWith('/') && !next.startsWith('/signin') ? next : '/';
  }

  protected async microsoft(): Promise<void> {
    this.busy.set(true);
    try {
      await this.auth.signInWithMicrosoft(this.returnTo);
    } catch (error) {
      this.localError.set(error instanceof Error ? error.message : 'Sign-in failed.');
      this.busy.set(false);
    }
  }

  protected useDemo(login: string): void {
    this.emailForm.setValue({ login });
    void this.signInDev();
  }

  protected async signInDev(): Promise<void> {
    this.localError.set('');
    if (this.emailForm.invalid) {
      this.localError.set('Use your KBTU login, e.g. a_seitkali');
      return;
    }
    this.busy.set(true);
    const user = await this.auth.signInDev(this.email);
    this.busy.set(false);
    if (user) await this.router.navigateByUrl(this.returnTo);
  }
}
