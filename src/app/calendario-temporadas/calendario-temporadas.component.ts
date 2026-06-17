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

interface EventoTemporada {
  id_evento: string;
  nombre: string;
  temporada_id: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  objetivo_ventas_bs: number;
  presupuesto_bs: number;
  estado: string;
  notas?: string | null;
}

@Component({
  selector: 'app-calendario-temporadas',
  standalone: true,
  imports: [CommonModule, FormsModule, NzTableModule, NzButtonModule, NzInputModule, NzMessageModule, SidebarComponent, TopbarComponent],
  templateUrl: './calendario-temporadas.component.html',
  styleUrl: './calendario-temporadas.component.css',
})
export class CalendarioTemporadasComponent implements OnInit {
  eventos: EventoTemporada[] = [];
  form = {
    nombre: '',
    temporada_id: 'TEMP-01',
    fecha_inicio: '',
    fecha_fin: '',
    objetivo_ventas_bs: 0,
    presupuesto_bs: 0,
    estado: 'planificado',
    notas: '',
  };

  constructor(private apiService: ApiService, private message: NzMessageService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.apiService.get<EventoTemporada[]>('calendario-temporadas').subscribe({
      next: (data) => (this.eventos = data || []),
      error: () => this.message.error('No se pudo cargar el calendario.'),
    });
  }

  crear(): void {
    if (!this.form.nombre.trim()) {
      this.message.warning('Debes indicar nombre del evento.');
      return;
    }
    this.apiService.post('calendario-temporadas', this.form).subscribe({
      next: () => {
        this.message.success('Evento registrado.');
        this.form = { nombre: '', temporada_id: 'TEMP-01', fecha_inicio: '', fecha_fin: '', objetivo_ventas_bs: 0, presupuesto_bs: 0, estado: 'planificado', notas: '' };
        this.cargar();
      },
      error: () => this.message.error('No se pudo registrar el evento.'),
    });
  }

  eliminar(id: string): void {
    this.apiService.delete(`calendario-temporadas/${id}`).subscribe({
      next: () => this.cargar(),
      error: () => this.message.error('No se pudo eliminar el evento.'),
    });
  }
}

