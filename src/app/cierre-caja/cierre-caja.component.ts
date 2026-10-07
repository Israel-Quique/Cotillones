import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ApiService } from '../api.service';

interface CierreCaja {
  id_cierre: string;
  fecha: string;
  responsable: string;
  efectivo_bs: number;
  qr_bs: number;
  transferencia_bs: number;
  total_ventas_bs: number;
  total_caja_bs: number;
  diferencia_bs: number;
  observaciones?: string | null;
}

@Component({
  selector: 'app-cierre-caja',
  standalone: true,
  imports: [CommonModule, FormsModule, NzTableModule, NzButtonModule, NzInputModule, NzModalModule, NzMessageModule, SidebarComponent, TopbarComponent],
  templateUrl: './cierre-caja.component.html',
  styleUrl: './cierre-caja.component.css',
})
export class CierreCajaComponent implements OnInit {
  cierres: CierreCaja[] = [];
  showForm = false;
  form = {
    fecha: new Date().toISOString().slice(0, 10),
    responsable: '',
    efectivo_bs: 0,
    qr_bs: 0,
    transferencia_bs: 0,
    observaciones: '',
  };

  constructor(private apiService: ApiService, private message: NzMessageService) {}

  ngOnInit(): void {
    this.cargar();
  }

  openForm(): void {
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  cargar(): void {
    this.apiService.get<CierreCaja[]>('cierres-caja').subscribe({
      next: (data) => (this.cierres = data || []),
      error: () => this.message.error('No se pudo cargar cierres de caja.'),
    });
  }

  registrarCierre(): void {
    if (!this.form.responsable.trim()) {
      this.message.warning('Ingresa responsable de caja.');
      return;
    }
    this.apiService.post('cierres-caja', this.form).subscribe({
      next: () => {
        this.message.success('Cierre diario registrado.');
        this.closeForm();
        this.cargar();
      },
      error: () => this.message.error('No se pudo registrar el cierre.'),
    });
  }
}
