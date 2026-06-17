import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Router, RouterModule } from '@angular/router';

interface SidebarLink {
  label: string;
  icon: string;
  route: string;
  description: string;
  accent?: 'red' | 'amber' | 'blue';
}

interface SidebarGroup {
  key: string;
  title: string;
  items: SidebarLink[];
}

interface SidebarBrand {
  title: string;
  subtitle: string;
  logoLetter: string;
}

interface SidebarSummary {
  eyebrow: string;
  title: string;
  description: string;
}

interface SidebarUser {
  name: string;
  status: string;
  initials: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  imports: [CommonModule, NzMenuModule, NzIconModule, RouterModule]
})
export class SidebarComponent implements OnInit {
  readonly brand: SidebarBrand = {
    title: 'Cotillones Ricky',
    subtitle: 'Centro operativo',
    logoLetter: 'R'
  };

  readonly summary: SidebarSummary = {
    eyebrow: 'Acceso activo',
    title: 'Panel administrativo conectado',
    description: 'Gestiona inventario, ventas y control interno desde un mismo menu.'
  };

  readonly navigationGroups: SidebarGroup[] = [
    {
      key: 'inventario',
      title: 'Inventario',
      items: [
        { label: 'Productos', icon: 'appstore', route: '/productos', description: 'Stock, precios y ubicaciones.' },
        { label: 'Combos', icon: 'gift', route: '/combos', description: 'Kits de fiesta y paquetes por evento.' },
        { label: 'Moldes', icon: 'tags', route: '/moldes', description: 'Modelos y base de trabajo.' },
        { label: 'Proveedores', icon: 'shop', route: '/provedor', description: 'Abastecimiento y contacto.' }
      ]
    },
    {
      key: 'operacion',
      title: 'Operacion',
      items: [
        { label: 'Ventas', icon: 'shopping-cart', route: '/ventas', description: 'Movimientos y detalle comercial.' },
        { label: 'Pedidos', icon: 'file-done', route: '/pedidos', description: 'Gestion operativa de pedidos y entregas.' },
        { label: 'Clientes', icon: 'team', route: '/clientes', description: 'Seguimiento y relacion comercial.' },
        { label: 'Cotiz. Telegram', icon: 'message', route: '/cotizaciones-telegram', description: 'Presupuestos rapidos por Telegram.' }
      ]
    },
    {
      key: 'administracion',
      title: 'Administracion',
      items: [
        { label: 'Dashboard Operativo', icon: 'dashboard', route: '/dashboard', description: 'Resumen general y metricas.', accent: 'red' },
        { label: 'Personal', icon: 'usergroup-add', route: '/personal', description: 'Usuarios y control interno.' },
        { label: 'Temporadas', icon: 'calendar', route: '/calendario-temporadas', description: 'Planificacion comercial por fecha.' },
        { label: 'Cierre de caja', icon: 'audit', route: '/cierre-caja', description: 'Control diario de ingresos por medio de pago.' }
      ]
    }
  ];

  user: SidebarUser = {
    name: 'Admin_Ricky',
    status: 'En linea',
    initials: 'AR'
  };
  isCollapsed = false;
  expandedGroups: Record<string, boolean> = {};

  constructor(public router: Router) {}

  ngOnInit(): void {
    this.user = this.buildUserProfile();
    this.isCollapsed = localStorage.getItem('riky_sidebar_collapsed') === 'true';
    this.expandedGroups = this.navigationGroups.reduce<Record<string, boolean>>((acc, group) => {
      acc[group.key] = true;
      return acc;
    }, {});
    this.openGroupForCurrentRoute();
    this.applySidebarWidth();
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  isGroupExpanded(groupKey: string): boolean {
    if (this.isCollapsed) {
      return true;
    }
    return this.expandedGroups[groupKey] ?? false;
  }

  toggleGroup(groupKey: string): void {
    if (this.isCollapsed) {
      return;
    }
    this.expandedGroups[groupKey] = !this.expandedGroups[groupKey];
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('riky_sidebar_collapsed', String(this.isCollapsed));
    if (!this.isCollapsed) {
      this.openGroupForCurrentRoute();
    }
    this.applySidebarWidth();
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('clienteId');
    localStorage.removeItem('personalId');
    sessionStorage.removeItem('authToken');
    this.router.navigate(['']);
  }

  private applySidebarWidth(): void {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      this.isCollapsed ? '92px' : '290px'
    );
  }

  private openGroupForCurrentRoute(): void {
    const current = this.router.url;
    this.navigationGroups.forEach((group) => {
      const hasActiveItem = group.items.some((item) => item.route === current);
      if (hasActiveItem) {
        this.expandedGroups[group.key] = true;
      }
    });
  }

  private buildUserProfile(): SidebarUser {
    const role = (localStorage.getItem('userRole') || 'admin').trim();
    const personalId = (localStorage.getItem('personalId') || '').trim();
    const clienteId = (localStorage.getItem('clienteId') || '').trim();
    const primaryId = personalId || clienteId || role;
    const normalizedRole = role.toLowerCase();

    const displayName = normalizedRole === 'admin'
      ? 'Admin_Ricky'
      : `${normalizedRole}_${primaryId || 'usuario'}`.replace(/\s+/g, '_');

    return {
      name: displayName,
      status: localStorage.getItem('authToken') ? 'En linea' : 'Sin sesion',
      initials: this.buildInitials(displayName)
    };
  }

  private buildInitials(value: string): string {
    const parts = value
      .replace(/[_-]+/g, ' ')
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean);

    return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'CR';
  }
}
