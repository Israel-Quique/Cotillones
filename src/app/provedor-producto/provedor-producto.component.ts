import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ApiService } from '../api.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { RegistroComponent } from './registro/registro.component';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ProveedorProducto {
  id_proveedor_producto: string;
  nombre: string;
  nombre_contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  estado_proveedor_id: number;
}

export interface EstadoProveedor {
  id_estado_proveedor: number;
  nombre: string;
}

@Component({
  selector: 'app-provedor-producto',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent,
    TopbarComponent,
    NzGridModule,
    NzInputModule,
    NzFormModule,
    NzSelectModule,
    RegistroComponent,
    NzModalModule
  ],
  templateUrl: './provedor-producto.component.html',
  styleUrl: './provedor-producto.component.css'
})
export class ProvedorProductoComponent implements OnInit {
  searchTermProveedor = '';
  proveedores: ProveedorProducto[] = [];
  estadosProveedor: EstadoProveedor[] = [];
  editarProveedor: ProveedorProducto | null = null;
  isEditingProveedor = false;
  showRegistroProveedor = false;

  constructor(
    private apiService: ApiService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.cargarProveedores();
    this.cargarEstadosProveedor();
  }

  cargarProveedores(): void {
    this.apiService.get<ProveedorProducto[]>('proveedores-producto').subscribe({
      next: (data) => {
        this.proveedores = data;
      },
      error: (error) => {
        console.error('Error al cargar proveedores:', error);
        this.message.error('Error al cargar proveedores.');
      },
    });
  }

  cargarEstadosProveedor(): void {
    this.apiService.get<EstadoProveedor[]>('estados-proveedor').subscribe({
      next: (data) => {
        this.estadosProveedor = data;
      },
      error: (error) => {
        console.error('Error al cargar estados de proveedor:', error);
        this.message.error('Error al cargar estados de proveedor.');
      },
    });
  }

  getNombreEstadoProveedor(estadoId: number): string {
    const estado = this.estadosProveedor.find((est) => est.id_estado_proveedor === estadoId);
    return estado ? estado.nombre : 'Desconocido';
  }

  openRegistroProveedor(proveedor?: ProveedorProducto): void {
    if (this.showRegistroProveedor) {
      return;
    }
    this.showRegistroProveedor = true;
    if (proveedor) {
      this.editarProveedor = { ...proveedor };
      this.isEditingProveedor = true;
    } else {
      this.editarProveedor = null;
      this.isEditingProveedor = false;
    }
  }

  closeRegistroProveedor(): void {
    this.showRegistroProveedor = false;
    this.editarProveedor = null;
    this.isEditingProveedor = false;
  }

  onModalVisibleChange(visible: boolean): void {
    if (!visible && this.showRegistroProveedor) {
      this.closeRegistroProveedor();
    }
  }

  onSubmitRegistroProveedor(_formValue: any): void {
    this.cargarProveedores();
    this.closeRegistroProveedor();
  }

  editProveedor(proveedor: ProveedorProducto): void {
    this.openRegistroProveedor(proveedor);
  }

  deleteProveedor(id: string): void {
    this.apiService.delete(`proveedores-producto/${id}`).subscribe({
      next: () => {
        this.message.success('Proveedor eliminado exitosamente.');
        this.cargarProveedores();
      },
      error: (error) => {
        console.error('Error al eliminar proveedor:', error);
        this.message.error('Error al eliminar proveedor.');
      },
    });
  }

  activateProveedor(id: string): void {
    this.apiService.put(`proveedores-producto/${id}/estado`, { estado_proveedor_id: 1 }).subscribe({
      next: () => {
        this.message.success('Proveedor activado exitosamente.');
        this.cargarProveedores();
      },
      error: (error) => {
        console.error('Error al activar proveedor:', error);
        this.message.error('Error al activar proveedor.');
      },
    });
  }

  deactivateProveedor(id: string): void {
    this.apiService.put(`proveedores-producto/${id}/estado`, { estado_proveedor_id: 2 }).subscribe({
      next: () => {
        this.message.success('Proveedor desactivado exitosamente.');
        this.cargarProveedores();
      },
      error: (error) => {
        console.error('Error al desactivar proveedor:', error);
        this.message.error('Error al desactivar proveedor.');
      },
    });
  }

  exportarAExcelProveedores(): void {
    const dataToExport = this.filteredProveedores.map(proveedor => ({
      Nombre: proveedor.nombre,
      Contacto: proveedor.nombre_contacto,
      Telefono: proveedor.telefono,
      Email: proveedor.email,
      Direccion: proveedor.direccion,
      Notas: proveedor.notas,
      'Fecha Creacion': new Date(proveedor.fecha_creacion).toLocaleString(),
      'Fecha Actualizacion': new Date(proveedor.fecha_actualizacion).toLocaleString(),
      Estado: this.getNombreEstadoProveedor(proveedor.estado_proveedor_id)
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Proveedores': worksheet },
      SheetNames: ['Proveedores'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    this.guardarArchivoExcel(excelBuffer, 'lista_proveedores.xlsx');
  }

  private guardarArchivoExcel(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    saveAs(data, fileName);
  }

  get filteredProveedores(): ProveedorProducto[] {
    const term = this.searchTermProveedor.trim().toLowerCase();

    if (!term) {
      return this.proveedores;
    }

    return this.proveedores.filter((proveedor) =>
      [
        proveedor.nombre,
        proveedor.nombre_contacto || '',
        proveedor.telefono || '',
        proveedor.email || '',
        proveedor.direccion || '',
      ].some((value) => value.toLowerCase().includes(term))
    );
  }
}
