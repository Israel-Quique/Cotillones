import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ApiService } from '../api.service';

interface CotizacionTelegram {
  id_cotizacion: string;
  nombre_cliente: string;
  telefono_telegram: string;
  evento: string;
  fecha_evento: string | null;
  detalle: string | null;
  monto_estimado_bs: number;
  estado: string;
}

@Component({
  selector: 'app-cotizaciones-telegram',
  standalone: true,
  imports: [CommonModule, FormsModule, NzTableModule, NzButtonModule, NzInputModule, NzMessageModule, SidebarComponent, TopbarComponent],
  templateUrl: './cotizaciones-telegram.component.html',
  styleUrl: './cotizaciones-telegram.component.css',
})
export class CotizacionesTelegramComponent implements OnInit {
  cotizaciones: CotizacionTelegram[] = [];
  form = {
    nombre_cliente: '',
    telefono_telegram: '',
    evento: '',
    fecha_evento: '',
    detalle: '',
    monto_estimado_bs: 0,
    estado: 'pendiente',
  };

  constructor(private apiService: ApiService, private message: NzMessageService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.apiService.get<CotizacionTelegram[]>('cotizaciones-telegram').subscribe({
      next: (data) => (this.cotizaciones = data || []),
      error: () => this.message.error('No se pudieron cargar cotizaciones.'),
    });
  }

  registrar(): void {
    if (!this.form.nombre_cliente.trim()) {
      this.message.warning('Ingresa el nombre del cliente.');
      return;
    }
    this.apiService.post('cotizaciones-telegram', this.form).subscribe({
      next: () => {
        this.message.success('Cotizacion registrada.');
        this.form = { nombre_cliente: '', telefono_telegram: '', evento: '', fecha_evento: '', detalle: '', monto_estimado_bs: 0, estado: 'pendiente' };
        this.cargar();
      },
      error: () => this.message.error('No se pudo registrar la cotizacion.'),
    });
  }

  cambiarEstado(cotizacion: CotizacionTelegram, estado: string): void {
    this.apiService.put(`cotizaciones-telegram/${cotizacion.id_cotizacion}`, { estado }).subscribe({
      next: () => this.cargar(),
      error: () => this.message.error('No se pudo actualizar estado.'),
    });
  }
}

