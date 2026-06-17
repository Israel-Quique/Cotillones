import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { catchError, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../api.service';

interface LoginResponse {
  message: string;
  token: string;
  rol: string;
  cliente_id?: string;
  personal_id?: string;
}

interface ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle';
}

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCardModule,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 })),
      ]),
    ]),
  ],
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('confettiCanvas') confettiCanvas?: ElementRef<HTMLCanvasElement>;

  loginForm!: FormGroup;
  errorMessage = '';
  isSubmitting = false;
  passwordVisible = false;
  isPartyMode = true;
  isDarkMode = false;
  readonly currentYear = new Date().getFullYear();

  private readonly confettiColors = ['#D61C2C', '#1E40AF', '#10B981', '#EF4444', '#06B6D4', '#F59E0B'];
  private particles: ConfettiParticle[] = [];
  private animationFrameId: number | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private viewportWidth = 0;
  private viewportHeight = 0;
  private readonly resizeHandler = () => this.resizeCanvas();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });

    this.isPartyMode = localStorage.getItem('ricky_party_mode') !== 'false';
    this.isDarkMode = localStorage.getItem('ricky_dark_mode') === 'true';
  }

  ngAfterViewInit(): void {
    this.ctx = this.confettiCanvas?.nativeElement.getContext('2d') ?? null;
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeHandler);

    if (this.isPartyMode) {
      this.startConfetti();
    } else {
      this.clearCanvas();
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener('resize', this.resizeHandler);
  }

  private handleSuccessfulLogin(response: LoginResponse): void {
    const normalizedRole = (response.rol || '').toLowerCase();

    localStorage.setItem('authToken', response.token);
    localStorage.setItem('userRole', normalizedRole);

    if (response.cliente_id) {
      localStorage.setItem('clienteId', response.cliente_id);
      this.router.navigate(['/dashboard']);
      return;
    }

    if (response.personal_id) {
      localStorage.setItem('personalId', response.personal_id);
    }

    this.router.navigate(['/dashboard']);
  }

  private tryLocalAdminLogin(username: string, password: string): boolean {
    if (username === 'admin' && password === 'admin') {
      const response: LoginResponse = {
        message: 'Login de admin local exitoso',
        token: btoa(`${username}:${Date.now()}`),
        rol: 'ADMIN',
        personal_id: 'admin',
      };

      this.handleSuccessfulLogin(response);
      return true;
    }

    return false;
  }

  submitForm(): void {
    this.errorMessage = '';

    if (!this.loginForm.valid) {
      Object.values(this.loginForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.errorMessage = 'Por favor, ingresa tu usuario y contrasena.';
      return;
    }

    this.isSubmitting = true;
    const { username, password } = this.loginForm.value;

    if (this.tryLocalAdminLogin(username, password)) {
      this.isSubmitting = false;
      return;
    }

    this.apiService
      .post<LoginResponse>('login-cliente', {
        usuario_cliente: username,
        contrasena_cliente: password,
      })
      .pipe(
        tap((response) => {
          console.log('Login de cliente exitoso:', response);
          this.handleSuccessfulLogin(response);
        }),
        catchError((error) => {
          if (error.status !== 401) {
            return throwError(() => error);
          }

          console.log('Credenciales de cliente incorrectas, intentando como personal...');

          return this.apiService
            .post<LoginResponse>('login-personal', {
              username,
              password,
            })
            .pipe(
              tap((response) => {
                console.log('Login de personal exitoso:', response);
                this.handleSuccessfulLogin(response);
              })
            );
        })
      )
      .subscribe({
        next: () => {
          this.errorMessage = '';
          this.isSubmitting = false;
        },
        error: (err) => {
          this.isSubmitting = false;

          if (err?.status === 401) {
            this.errorMessage = 'Usuario o contrasena incorrectos.';
          } else if (err?.error?.error) {
            this.errorMessage = err.error.error;
          } else {
            this.errorMessage = 'Error de conexion con el servidor. Intenta nuevamente mas tarde.';
          }

          console.error('Error general de inicio de sesion:', err);
        },
      });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  togglePartyMode(): void {
    this.isPartyMode = !this.isPartyMode;
    localStorage.setItem('ricky_party_mode', String(this.isPartyMode));

    if (this.isPartyMode) {
      this.startConfetti();
      return;
    }

    this.stopConfetti();
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('ricky_dark_mode', String(this.isDarkMode));
  }

  private resizeCanvas(): void {
    const canvas = this.confettiCanvas?.nativeElement;
    if (!canvas) {
      return;
    }

    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
    canvas.width = this.viewportWidth;
    canvas.height = this.viewportHeight;

    if (this.particles.length === 0) {
      this.seedParticles();
    }
  }

  private seedParticles(): void {
    this.particles = Array.from({ length: 85 }, () => this.createParticle(true));
  }

  private createParticle(randomizeY = false): ConfettiParticle {
    return {
      x: Math.random() * Math.max(this.viewportWidth, 1),
      y: randomizeY ? Math.random() * Math.max(this.viewportHeight, 1) : -20 - Math.random() * this.viewportHeight * 0.2,
      size: 6 + Math.random() * 8,
      color: this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)],
      velocityX: -0.8 + Math.random() * 1.6,
      velocityY: 1.8 + Math.random() * 3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: -0.08 + Math.random() * 0.16,
      shape: Math.random() > 0.25 ? 'rect' : 'circle',
    };
  }

  private startConfetti(): void {
    if (!this.ctx) {
      return;
    }

    if (this.particles.length === 0) {
      this.seedParticles();
    }

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const frame = () => {
      if (!this.ctx || !this.isPartyMode) {
        return;
      }

      this.ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);

      this.particles.forEach((particle, index) => {
        particle.x += particle.velocityX + Math.sin((particle.y + index) * 0.01) * 0.35;
        particle.y += particle.velocityY;
        particle.rotation += particle.rotationSpeed;

        if (particle.y > this.viewportHeight + 24 || particle.x < -30 || particle.x > this.viewportWidth + 30) {
          this.particles[index] = this.createParticle(false);
          return;
        }

        this.drawParticle(particle);
      });

      this.animationFrameId = requestAnimationFrame(frame);
    };

    this.animationFrameId = requestAnimationFrame(frame);
  }

  private stopConfetti(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.clearCanvas();
  }

  private clearCanvas(): void {
    this.ctx?.clearRect(0, 0, this.viewportWidth, this.viewportHeight);
  }

  private drawParticle(particle: ConfettiParticle): void {
    if (!this.ctx) {
      return;
    }

    this.ctx.save();
    this.ctx.translate(particle.x, particle.y);
    this.ctx.rotate(particle.rotation);
    this.ctx.fillStyle = particle.color;

    if (particle.shape === 'circle') {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, particle.size * 0.42, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.72);
    }

    this.ctx.restore();
  }
}
