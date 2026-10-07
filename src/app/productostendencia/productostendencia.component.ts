import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { ApiService } from '../api.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

export interface VentasDiarias {
  fecha_dia: string;
  ventas_totales_dia: number;
  cantidad_ventas: number;
}

export interface ProductoVentasDiarias {
  producto_id: string;
  producto_nombre: string;
  cantidad_vendida: number;
  ventas_totales_bs: number;
  ultima_fecha_venta: string | null;
}

@Component({
  selector: 'app-productostendencia',
  standalone: true,
  imports: [CommonModule, SidebarComponent, TopbarComponent, NzTableModule, NzCardModule],
  templateUrl: './productostendencia.component.html',
  styleUrl: './productostendencia.component.css'
})
export class ProductostendenciaComponent implements OnInit {
  ventasDiarias: VentasDiarias[] = [];
  productosTendencia: ProductoVentasDiarias[] = [];
  totalVentasBs = 0;
  totalUnidadesVendidas = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarResumen();
  }

  private cargarResumen(): void {
    this.apiService.get<VentasDiarias[]>('ventas-diarias').subscribe({
      next: (data) => {
        this.ventasDiarias = data;
        this.totalVentasBs = data.reduce((sum, row) => sum + Number(row.ventas_totales_dia || 0), 0);
      },
      error: (error) => console.error('Error al cargar ventas diarias:', error)
    });

    this.apiService.get<ProductoVentasDiarias[]>('all-productos-ventas-diarias').subscribe({
      next: (data) => {
        this.productosTendencia = data;
        this.totalUnidadesVendidas = data.reduce((sum, row) => sum + Number(row.cantidad_vendida || 0), 0);
      },
      error: (error) => console.error('Error al cargar tendencia por producto:', error)
    });
  }
}
