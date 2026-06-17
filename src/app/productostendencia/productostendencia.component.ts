import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
// Si RegistroComponent es para clientes, necesitarás un componente específico para el registro de pedidos.
// Por ahora, lo dejaré comentado como en tu código original, pero ten esto en cuenta.
// import { RegistroComponent } from './registro/registro.component';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ApiService } from '../api.service';
import { FormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms'; // FormBuilder y Validators no se están usando en este componente actualmente
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';

// Interfaz para datos agregados por fecha (ej. ventas diarias totales)
export interface VentasDiarias {
  fecha_dia: string; // Formato 'YYYY-MM-DD'
  ventas_totales_dia: number;
}

// Interfaz para datos agregados por producto y fecha (ej. cantidad vendida de un producto X por día)
export interface ProductoVentasDiarias {
  fecha_dia: string;
  producto_id: string;
  cantidad_vendida: number;
}

@Component({
  selector: 'app-productostendencia',
  standalone: true,
  imports: [CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    FormsModule,
    SidebarComponent,
    TopbarComponent,
    NzGridModule,
    NzInputModule,
    NzFormModule,],
  templateUrl: './productostendencia.component.html',
  styleUrl: './productostendencia.component.css'
})
export class ProductostendenciaComponent {
  private apiUrl = 'http://localhost:3000'; // Reemplaza con la URL base de tu API

  constructor(private http: HttpClient) {}

  // ... (métodos existentes como getDetallesVenta) ...

  getVentasTotalesDiarias(): Observable<VentasDiarias[]> {
    return this.http.get<VentasDiarias[]>(`${this.apiUrl}/ventas-diarias`); // Endpoint de tu API
  }

  getProductoVentasDiarias(productoId: string): Observable<ProductoVentasDiarias[]> {
    return this.http.get<ProductoVentasDiarias[]>(`${this.apiUrl}/producto-ventas-diarias/${productoId}`); // Endpoint de tu API
  }

  // O para obtener todos los productos y sus ventas diarias para un análisis más complejo
  getAllProductosVentasDiarias(): Observable<ProductoVentasDiarias[]> {
    return this.http.get<ProductoVentasDiarias[]>(`${this.apiUrl}/all-productos-ventas-diarias`);
  }
}
