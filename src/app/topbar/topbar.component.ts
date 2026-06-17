import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';

interface BrandLetter {
  char: string;
  color: string;
}

interface StatusCard {
  label: string;
  value: string;
  detail: string;
  highlight?: boolean;
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

interface ToastState {
  type: 'success' | 'info';
  title: string;
  message: string;
  visible: boolean;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css'],
  imports: [CommonModule],
})
export class TopbarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('confettiCanvas') confettiCanvas?: ElementRef<HTMLCanvasElement>;

  readonly eyebrow = 'Portal corporativo premium';
  readonly description = 'Inventario, ventas, pedidos y control administrativo';
  readonly brandLetters: BrandLetter[] = [
    { char: 'C', color: '#1e40af' },
    { char: 'o', color: '#10b981' },
    { char: 't', color: '#ef4444' },
    { char: 'i', color: '#06b6d4' },
    { char: 'l', color: '#f59e0b' },
    { char: 'l', color: '#d61c2c' },
    { char: 'o', color: '#fcd34d' },
    { char: 'n', color: '#1e40af' },
    { char: 'e', color: '#10b981' },
    { char: 's', color: '#ef4444' }
  ];

  currentTime = new Date();
  userRole = (localStorage.getItem('userRole') || 'admin').toUpperCase();
  activeModule = 'Dashboard Operativo';
  isPartyMode = false;
  isDarkMode = false;
  toast: ToastState = {
    type: 'info',
    title: '',
    message: '',
    visible: false
  };

  private clockId?: ReturnType<typeof setInterval>;
  private routerSubscription?: Subscription;
  private toastId?: ReturnType<typeof setTimeout>;
  private readonly confettiColors = ['#D61C2C', '#1E40AF', '#10B981', '#EF4444', '#06B6D4', '#F59E0B'];
  private particles: ConfettiParticle[] = [];
  private animationFrameId: number | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private viewportWidth = 0;
  private viewportHeight = 0;
  private readonly resizeHandler = () => this.resizeCanvas();

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    this.refreshSessionState();
    this.syncActiveModule(this.router.url);
    this.isPartyMode = localStorage.getItem('ricky_party_mode') !== 'false';
    this.isDarkMode = localStorage.getItem('ricky_dark_mode') === 'true';
    this.applyDocumentModes();
    this.clockId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.syncActiveModule((event as NavigationEnd).urlAfterRedirects);
      });
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
    if (this.clockId) {
      clearInterval(this.clockId);
    }
    if (this.toastId) {
      clearTimeout(this.toastId);
    }
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.resizeHandler);
    this.routerSubscription?.unsubscribe();
  }

  get statusCards(): StatusCard[] {
    return [
      {
        label: 'Operacion',
        value: localStorage.getItem('authToken') ? 'En linea' : 'Sin sesion',
        detail: this.activeModule,
        highlight: true
      },
      {
        label: 'Fecha',
        value: this.currentTime.toLocaleDateString('es-BO'),
        detail: this.currentTime.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
      },
      {
        label: 'Perfil',
        value: this.userRole,
        detail: 'Sesion autorizada'
      }
    ];
  }

  togglePartyMode(): void {
    this.isPartyMode = !this.isPartyMode;
    localStorage.setItem('ricky_party_mode', String(this.isPartyMode));
    this.playAudioTone(this.isPartyMode ? 'success' : 'info');
    if (this.isPartyMode) {
      this.startConfetti();
      this.showToast('success', 'Modo Fiesta Activado', 'Confetti festivo en pantalla y ambiente visual dinamico en ejecucion.');
    } else {
      this.stopConfetti();
      this.showToast('info', 'Modo Fiesta Desactivado', 'Se limpio el confetti y el panel regreso a una vista sobria.');
    }
    window.dispatchEvent(new CustomEvent('riky-party-mode-change', { detail: this.isPartyMode }));
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('ricky_dark_mode', String(this.isDarkMode));
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyDocumentModes();
    this.playAudioTone('soft');
    this.showToast(
      'info',
      this.isDarkMode ? 'Modo Nocturno Activado' : 'Modo Claro Restaurado',
      this.isDarkMode
        ? 'La interfaz cambio a la paleta oscura del portal corporativo.'
        : 'La interfaz volvio a los tonos claros tradicionales.'
    );
    window.dispatchEvent(new CustomEvent('riky-dark-mode-change', { detail: this.isDarkMode }));
  }

  private refreshSessionState(): void {
    this.userRole = (localStorage.getItem('userRole') || 'admin').toUpperCase();
  }

  private syncActiveModule(url: string): void {
    const labelMap: Record<string, string> = {
      '/dashboard': 'Dashboard Operativo',
      '/productos': 'Productos',
      '/combos': 'Combos',
      '/moldes': 'Moldes',
      '/provedor': 'Proveedores',
      '/ventas': 'Ventas',
      '/pedidos': 'Pedidos',
      '/clientes': 'Clientes',
      '/cotizaciones-telegram': 'Cotizaciones Telegram',
      '/personal': 'Personal',
      '/calendario-temporadas': 'Temporadas',
      '/cierre-caja': 'Cierre de Caja'
    };

    this.activeModule = labelMap[url] || 'Panel Operativo';
  }

  private applyDocumentModes(): void {
    document.documentElement.classList.toggle('dark', this.isDarkMode);
    document.body.classList.toggle('dark-mode', this.isDarkMode);
    document.documentElement.classList.toggle('dark-mode', this.isDarkMode);
  }

  private showToast(type: 'success' | 'info', title: string, message: string): void {
    if (this.toastId) {
      clearTimeout(this.toastId);
    }

    this.toast = {
      type,
      title,
      message,
      visible: true
    };

    this.toastId = setTimeout(() => {
      this.toast.visible = false;
    }, 3200);
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
    this.particles = Array.from({ length: 90 }, () => this.createParticle(true));
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
      shape: Math.random() > 0.25 ? 'rect' : 'circle'
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

  private playAudioTone(mode: 'success' | 'info' | 'soft'): void {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    const context = new AudioContextCtor();
    const notes = mode === 'success'
      ? [523.25, 659.25, 783.99]
      : mode === 'soft'
        ? [392.0, 493.88]
        : [349.23];

    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * 0.08;

      oscillator.type = mode === 'info' ? 'triangle' : 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.2);
    });

    const totalDuration = notes.length * 120 + 300;
    setTimeout(() => {
      void context.close();
    }, totalDuration);
  }
}
