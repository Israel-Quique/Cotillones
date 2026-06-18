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
  badge?: string;
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

  readonly allNavigationGroups: SidebarGroup[] = [
    {
      key: 'inventario',
      title: 'Secciones principales',
      items: [
        { label: 'Dashboard Operativo', icon: 'pie-chart', route: '/dashboard', description: 'Vista central del negocio.', accent: 'amber' },
        { label: 'Gestion de Productos', icon: 'appstore', route: '/productos', description: 'Stock, precios y ubicaciones.', badge: '6' },
        { label: 'Combos', icon: 'gift', route: '/combos', description: 'Kits y paquetes comerciales.' },
        { label: 'Moldes', icon: 'tags', route: '/moldes', description: 'Modelos y base de trabajo.' },
        { label: 'Proveedores', icon: 'shop', route: '/provedor', description: 'Abastecimiento y contacto.' },
        { label: 'Directorio de Clientes', icon: 'team', route: '/clientes', description: 'Seguimiento comercial y contacto.', badge: '4' },
        { label: 'Registrar Venta', icon: 'shopping-cart', route: '/ventas', description: 'Ventas del dia y control comercial.', badge: '3' },
        { label: 'Pedidos Operativos', icon: 'file-done', route: '/pedidos', description: 'Pedidos en curso y despacho.', badge: '2' },
        { label: 'Control de Fletes', icon: 'car', route: '/cierre-caja', description: 'Monitoreo logistico y caja.', badge: '2' },
        { label: 'Cotiz. Telegram', icon: 'message', route: '/cotizaciones-telegram', description: 'Presupuestos rapidos por Telegram.' }
      ]
    },
    {
      key: 'administracion',
      title: 'Modo admin',
      items: [
        { label: 'Personal', icon: 'usergroup-add', route: '/personal', description: 'Usuarios y control interno.' },
        { label: 'Temporadas', icon: 'calendar', route: '/calendario-temporadas', description: 'Planificacion comercial por fecha.' }
      ]
    }
  ];

  navigationGroups: SidebarGroup[] = [];
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
    this.navigationGroups = this.buildNavigationForRole();
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

  private buildNavigationForRole(): SidebarGroup[] {
    const normalizedRole = (localStorage.getItem('userRole') || 'admin').trim().toLowerCase();
    if (normalizedRole === 'admin') {
      return this.allNavigationGroups;
    }

    return this.allNavigationGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !['/personal', '/calendario-temporadas'].includes(item.route))
      }))
      .filter((group) => group.items.length > 0);
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
