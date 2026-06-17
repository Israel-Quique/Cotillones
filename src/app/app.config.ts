import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNzI18n, es_ES } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es';
import { LoginComponent } from './login/login.component';
import { ClientesComponent } from './clientes/clientes.component';
import { ProductosComponent } from './productos/productos.component';
import { PersonalComponent } from './personal/personal.component';
import { VentasComponent } from './ventas/ventas.component';
import { ProvedorProductoComponent } from './provedor-producto/provedor-producto.component';
import { MoldesComponent } from './moldes/moldes.component';
import { authGuard } from './auth.guard';
import { authInterceptor } from './auth.interceptor';
import { CombosComponent } from './combos/combos.component';
import { CalendarioTemporadasComponent } from './calendario-temporadas/calendario-temporadas.component';
import { CierreCajaComponent } from './cierre-caja/cierre-caja.component';
import { CotizacionesTelegramComponent } from './cotizaciones-telegram/cotizaciones-telegram.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PedidosComponent } from './pedidos/pedidos.component';

registerLocaleData(es);

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'clientes', component: ClientesComponent, canActivate: [authGuard] },
  { path: 'productos', component: ProductosComponent, canActivate: [authGuard] },
  { path: 'personal', component: PersonalComponent, canActivate: [authGuard] },
  { path: 'ventas', component: VentasComponent, canActivate: [authGuard] },
  { path: 'provedor', component: ProvedorProductoComponent, canActivate: [authGuard] },
  { path: 'moldes', component: MoldesComponent, canActivate: [authGuard] },
  { path: 'combos', component: CombosComponent, canActivate: [authGuard] },
  { path: 'calendario-temporadas', component: CalendarioTemporadasComponent, canActivate: [authGuard] },
  { path: 'cierre-caja', component: CierreCajaComponent, canActivate: [authGuard] },
  { path: 'cotizaciones-telegram', component: CotizacionesTelegramComponent, canActivate: [authGuard] },
  { path: 'pedidos', component: PedidosComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' }
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNzI18n(es_ES),
  ]
};
