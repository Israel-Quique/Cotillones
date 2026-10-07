import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ApiService } from '../api.service';

interface ComboItem {
  id_producto: string;
  cantidad: number;
}

interface Combo {
  id_combo: string;
  nombre: string;
  descripcion?: string | null;
  precio_combo: number;
  descuento_porcentaje: number;
  activo: boolean;
  items: ComboItem[];
}

@Component({
  selector: 'app-combos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzModalModule,
    NzMessageModule,
    SidebarComponent,
    TopbarComponent,
  ],
  templateUrl: './combos.component.html',
  styleUrl: './combos.component.css',
})
export class CombosComponent implements OnInit {
  combos: Combo[] = [];
  searchTerm = '';
  showForm = false;
  form = {
    nombre: '',
    descripcion: '',
    precio_combo: 0,
    descuento_porcentaje: 0,
    itemsText: 'PROD-001:1',
  };

  constructor(private apiService: ApiService, private message: NzMessageService) {}

  ngOnInit(): void {
    this.cargarCombos();
  }

  openForm(): void {
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  cargarCombos(): void {
    this.apiService.get<Combo[]>('combos').subscribe({
      next: (data) => (this.combos = data || []),
      error: () => this.message.error('No se pudieron cargar los combos.'),
    });
  }

  crearCombo(): void {
    if (!this.form.nombre.trim()) {
      this.message.warning('Debes escribir el nombre del combo.');
      return;
    }

    const payload = {
      nombre: this.form.nombre.trim(),
      descripcion: this.form.descripcion.trim() || null,
      precio_combo: Number(this.form.precio_combo) || 0,
      descuento_porcentaje: Number(this.form.descuento_porcentaje) || 0,
      items: this.parseItems(this.form.itemsText),
    };

    this.apiService.post<Combo>('combos', payload).subscribe({
      next: () => {
        this.message.success('Combo creado.');
        this.form = { nombre: '', descripcion: '', precio_combo: 0, descuento_porcentaje: 0, itemsText: 'PROD-001:1' };
        this.closeForm();
        this.cargarCombos();
      },
      error: () => this.message.error('No se pudo crear el combo.'),
    });
  }

  toggleActivo(combo: Combo): void {
    this.apiService.put<Combo>(`combos/${combo.id_combo}`, { activo: !combo.activo }).subscribe({
      next: () => this.cargarCombos(),
      error: () => this.message.error('No se pudo actualizar el estado del combo.'),
    });
  }

  eliminarCombo(id: string): void {
    this.apiService.delete(`combos/${id}`).subscribe({
      next: () => {
        this.message.success('Combo eliminado.');
        this.cargarCombos();
      },
      error: () => this.message.error('No se pudo eliminar el combo.'),
    });
  }

  private parseItems(input: string): ComboItem[] {
    return (input || '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [idProducto, cantidad] = part.split(':');
        return {
          id_producto: (idProducto || '').trim(),
          cantidad: Number(cantidad) || 1,
        };
      })
      .filter((item) => item.id_producto);
  }

  get filteredCombos(): Combo[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.combos;
    }
    return this.combos.filter((combo) =>
      [combo.id_combo, combo.nombre, combo.descripcion || ''].some((value) => value.toLowerCase().includes(term))
    );
  }
}
