import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ApiService } from '../api.service';
import { catchError, forkJoin, map, of } from 'rxjs';

interface DashboardMetric {
  label: string;
  value: number;
  icon: string;
  hint: string;
  accent?: 'red' | 'amber' | 'green' | 'blue' | 'cyan' | 'violet';
}

interface BusinessPulse {
  label: string;
  value: string;
  progress: number;
  tone: 'good' | 'warn' | 'risk';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NzIconModule, SidebarComponent, TopbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  metrics: DashboardMetric[] = [
    { label: 'Productos', value: 0, icon: 'appstore', hint: 'Items en inventario' },
    { label: 'Clientes', value: 0, icon: 'team', hint: 'Clientes registrados' },
    { label: 'Ventas', value: 0, icon: 'shopping-cart', hint: 'Ventas registradas' },
    { label: 'Personal', value: 0, icon: 'usergroup-add', hint: 'Usuarios internos' }
  ];

  logisticsInfo: { label: string; value: string }[] = [];
  businessPulse: BusinessPulse[] = [];
  operationalAlerts: string[] = [];
  online = navigator.onLine;
  lastUpdate = new Date();
  cashTotalBs = 0;
  isPartyMode = false;
  readonly heroHighlights = ['Cobertura multi area', 'Analisis en tiempo real'];
  readonly partyDecorations = [
    { top: '6%', left: '22%', color: '#06b6d4', size: '8px', rotate: '-8deg' },
    { top: '8%', left: '52%', color: '#fbbf24', size: '15px', rotate: '45deg' },
    { top: '14%', right: '20%', color: '#22c55e', size: '10px', rotate: '-6deg' },
    { top: '18%', right: '9%', color: '#dc2626', size: '15px', rotate: '2deg' },
    { top: '30%', left: '78%', color: '#0ea5e9', size: '8px', rotate: '28deg' },
    { top: '48%', left: '12%', color: '#ef4444', size: '14px', rotate: '40deg' },
    { top: '62%', left: '47%', color: '#10b981', size: '9px', rotate: '14deg' },
    { top: '71%', right: '28%', color: '#ef4444', size: '10px', rotate: '-16deg' },
    { bottom: '20%', left: '33%', color: '#dc2626', size: '12px', rotate: '-22deg' },
    { bottom: '14%', right: '24%', color: '#fbbf24', size: '11px', rotate: '36deg' },
    { bottom: '9%', left: '58%', color: '#0ea5e9', size: '10px', rotate: '12deg' },
    { bottom: '2%', right: '42%', color: '#22c55e', size: '13px', rotate: '48deg' }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.isPartyMode = localStorage.getItem('ricky_party_mode') !== 'false';
    this.loadDashboardData();
    window.addEventListener('online', this.handleConnectionChange);
    window.addEventListener('offline', this.handleConnectionChange);
    window.addEventListener('riky-party-mode-change', this.handlePartyModeChange as EventListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.handleConnectionChange);
    window.removeEventListener('offline', this.handleConnectionChange);
    window.removeEventListener('riky-party-mode-change', this.handlePartyModeChange as EventListener);
  }

  private readonly handleConnectionChange = (): void => {
    this.online = navigator.onLine;
  };

  private readonly handlePartyModeChange = (event: CustomEvent<boolean>): void => {
    this.isPartyMode = Boolean(event.detail);
  };

  private loadDashboardData(): void {
    forkJoin({
      productos: this.fetchCollectionCount('productos'),
      clientes: this.fetchCollectionCount('clientes'),
      ventas: this.fetchSalesSummary(),
      personal: this.fetchCollectionCount('personal'),
      proveedores: this.fetchCollectionCount('proveedores-producto'),
      pedidos: this.fetchCollectionCount('Pedidos'),
      fletes: this.fetchFreightCount()
    }).subscribe((data) => {
      this.metrics = [
        { label: 'Productos', value: data.productos, icon: 'appstore', hint: 'Items en inventario', accent: 'amber' },
        { label: 'Clientes', value: data.clientes, icon: 'team', hint: 'Clientes registrados', accent: 'red' },
        { label: 'Ventas', value: data.ventas.count, icon: 'shopping-cart', hint: 'Ventas registradas', accent: 'green' },
        { label: 'Personal', value: data.personal, icon: 'usergroup-add', hint: 'Usuarios internos', accent: 'blue' },
        { label: 'Proveedores', value: data.proveedores, icon: 'shop', hint: 'Base de abastecimiento', accent: 'amber' },
        { label: 'Pedidos', value: data.pedidos, icon: 'file-done', hint: 'Pedidos operativos', accent: 'cyan' },
        { label: 'Fletes', value: data.fletes, icon: 'car', hint: 'Registros logisticos', accent: 'violet' }
      ];
      this.cashTotalBs = data.ventas.total;
      this.logisticsInfo = [
        { label: 'Proveedores activos', value: `${data.proveedores}` },
        { label: 'Pedidos gestionados', value: `${data.pedidos}` },
        { label: 'Fletes registrados', value: `${data.fletes}` },
        { label: 'Cobertura de proveedores', value: `${this.safePercent(data.proveedores, data.productos)}%` },
        { label: 'Carga comercial por vendedor', value: `${this.safeRatio(data.ventas.count, data.personal)}` }
      ];
      this.buildBusinessPulse(data);
      this.buildOperationalAlerts(data);
      this.lastUpdate = new Date();
    });
  }

  private fetchSalesSummary() {
    return this.apiService.get<unknown>('ventas').pipe(
      map((response) => {
        const rows = this.extractArrayPayload(response);
        const total = rows.reduce((sum, row) => sum + this.toNumber(row['total']), 0);
        return {
          count: rows.length,
          total
        };
      }),
      catchError(() => of({ count: 0, total: 0 }))
    );
  }

  private fetchCollectionCount(endpoint: string) {
    return this.apiService.get<unknown>(endpoint).pipe(
      map((response) => this.extractCount(response)),
      catchError(() => of(0))
    );
  }

  private extractCount(response: unknown): number {
    if (Array.isArray(response)) {
      return response.length;
    }

    if (response && typeof response === 'object') {
      const candidate = response as Record<string, unknown>;
      const possibleArrays = ['data', 'items', 'results', 'ventas', 'clientes', 'productos', 'personal', 'proveedores', 'pedidos', 'fletes'];
      for (const key of possibleArrays) {
        if (Array.isArray(candidate[key])) {
          return (candidate[key] as unknown[]).length;
        }
      }
    }

    return 0;
  }

  private fetchFreightCount() {
    return this.apiService.get<unknown>('fletes').pipe(
      map((response) => this.extractCount(response)),
      catchError(() =>
        this.apiService.get<unknown>('Pedidos').pipe(
          map((response) => this.extractFreightFromOrders(response)),
          catchError(() => of(0))
        )
      )
    );
  }

  private extractFreightFromOrders(response: unknown): number {
    const orders = this.extractArrayPayload(response);
    return orders.filter((order) => {
      const description = String(order['descripcion_pedido'] || '').toLowerCase();
      return description.includes('flete') || description.includes('envio') || description.includes('transporte');
    }).length;
  }

  private extractArrayPayload(response: unknown): Record<string, unknown>[] {
    if (Array.isArray(response)) {
      return response as Record<string, unknown>[];
    }

    if (response && typeof response === 'object') {
      const candidate = response as Record<string, unknown>;
      const possibleArrays = ['data', 'items', 'results', 'pedidos'];
      for (const key of possibleArrays) {
        if (Array.isArray(candidate[key])) {
          return candidate[key] as Record<string, unknown>[];
        }
      }
    }

    return [];
  }

  private buildBusinessPulse(data: {
    productos: number;
    clientes: number;
    ventas: { count: number; total: number };
    personal: number;
    proveedores: number;
    pedidos: number;
    fletes: number;
  }): void {
    const fulfillment = this.safePercent(data.fletes, data.pedidos);
    const supplierCoverage = this.safePercent(data.proveedores, data.productos);
    const commercialLoad = this.safePercent(data.ventas.count, Math.max(data.personal, 1) * 12);

    this.businessPulse = [
      {
        label: 'Cumplimiento logistico',
        value: `${fulfillment}%`,
        progress: fulfillment,
        tone: fulfillment >= 70 ? 'good' : fulfillment >= 40 ? 'warn' : 'risk'
      },
      {
        label: 'Cobertura de abastecimiento',
        value: `${supplierCoverage}%`,
        progress: supplierCoverage,
        tone: supplierCoverage >= 45 ? 'good' : supplierCoverage >= 25 ? 'warn' : 'risk'
      },
      {
        label: 'Ritmo comercial del equipo',
        value: `${commercialLoad}%`,
        progress: commercialLoad,
        tone: commercialLoad >= 65 ? 'good' : commercialLoad >= 35 ? 'warn' : 'risk'
      }
    ];
  }

  private buildOperationalAlerts(data: {
    productos: number;
    ventas: { count: number; total: number };
    personal: number;
    proveedores: number;
    pedidos: number;
    fletes: number;
  }): void {
    const alerts: string[] = [];

    if (data.proveedores === 0) {
      alerts.push('No hay proveedores activos en el sistema.');
    }
    if (data.pedidos > 0 && data.fletes === 0) {
      alerts.push('Hay pedidos sin trazabilidad de flete.');
    }
    if (data.personal > 0 && data.ventas.count > data.personal * 20) {
      alerts.push('La carga comercial por personal esta alta, revisa capacidad del equipo.');
    }
    if (data.productos > 0 && data.proveedores <= 1) {
      alerts.push('Dependencia de pocos proveedores para el volumen actual de inventario.');
    }

    this.operationalAlerts = alerts.length ? alerts : ['Operacion estable. No se detectaron alertas criticas en este corte.'];
  }

  toneClass(tone: 'good' | 'warn' | 'risk'): string {
    return `tone-${tone}`;
  }

  metricAccentClass(accent: DashboardMetric['accent']): string {
    return accent ? `accent-${accent}` : '';
  }

  private safePercent(base: number, total: number): number {
    if (!total || total <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((base / total) * 100));
  }

  private safeRatio(base: number, total: number): string {
    if (!total || total <= 0) {
      return '0';
    }
    return (base / total).toFixed(1);
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
