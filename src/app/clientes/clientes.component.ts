import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormsModule, FormGroup } from '@angular/forms'; // Importa FormGroup
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ApiService } from '../api.service';
import { RegistroComponent } from './registro/registro.component';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import * as XLSX from 'xlsx';

interface Cliente {
  id_cliente: number; // Cambiado a number y nombre correcto
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  direccion: string;
  fecha_registro: string;
  fecha_nacimiento: string;
  genero: string;
  usuario_cliente: string; // Cambiado a nombre correcto
  contrasena_cliente: string; // Cambiado a nombre correcto
  carnet: number; // INTEGER en DB
  estado_id: number; // Añadido estado_id
}

@Component({
  selector: 'app-clientes',
  standalone: true, // Añadido standalone: true
  imports: [CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    FormsModule,
    SidebarComponent,
    TopbarComponent,
    RegistroComponent,
    NzGridModule,
    NzInputModule,
    NzModalModule,
    NzSelectModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent implements OnInit { // Implementa OnInit
  clientes: Cliente[] = [];
  searchTerm = '';
  selectedEstado = 'todos';
  showRegistro = false;
  showLista = true;
  editingCliente: Cliente | null = null;
  isEditing = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.apiService.get<Cliente[]>('clientes').subscribe((data) => {
      this.clientes = data;
    });
  }

  openRegistro(cliente?: Cliente) {
    if (this.showRegistro) {
      return;
    }
    this.showRegistro = true;
    this.showLista = false;
    if (cliente) {
      this.editingCliente = { ...cliente };
      this.isEditing = true;
    } else {
      this.editingCliente = null;
      this.isEditing = false;
    }
  }

  closeRegistro() {
    this.showRegistro = false;
    this.showLista = true;
    this.editingCliente = null;
    this.isEditing = false;
  }

  onModalVisibleChange(visible: boolean): void {
    if (!visible && this.showRegistro) {
      this.closeRegistro();
    }
  }

  onSubmitRegistro(formValue: FormGroup) { // Recibe el FormGroup emitido
    if (formValue.valid) {
      if (this.isEditing && this.editingCliente) {
        this.apiService.put<Cliente>(`clientes/${this.editingCliente.id_cliente}`, formValue.value).subscribe(() => {
          this.cargarClientes();
          this.closeRegistro();
        });
      } else {
        this.apiService.post<Cliente>('clientes', formValue.value).subscribe(() => {
          this.cargarClientes();
          this.closeRegistro();
        });
      }
    } else {
      Object.values(formValue.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  eliminarCliente(id: number) { // Cambiado el tipo de id a number
    this.apiService.delete(`clientes/${id}`).subscribe(() => {
      this.cargarClientes();
    });
  }

  exportarAExcel(): void {
    this.apiService.exportarClientes().subscribe((data) => {
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
      const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.guardarArchivoExcel(excelBuffer, 'lista_clientes.xlsx');
    });
  }

  guardarArchivoExcel(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const url: string = window.URL.createObjectURL(data);
    const a: HTMLAnchorElement = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }


  desactivarCliente(id: number) {
    this.apiService.put(`clientes/${id}/estado`, { estado_id: 2 }).subscribe(() => {
      this.cargarClientes();
    });
  }

  activarCliente(id: number) {
    this.apiService.put(`clientes/${id}/estado`, { estado_id: 1 }).subscribe(() => {
      this.cargarClientes();
    });
  }

  get filteredClientes(): Cliente[] {
    const term = this.searchTerm.trim().toLowerCase();
    const byEstado = this.selectedEstado === 'todos'
      ? this.clientes
      : this.clientes.filter((cliente) =>
          this.selectedEstado === 'activos' ? cliente.estado_id === 1 : cliente.estado_id !== 1
        );

    if (!term) {
      return byEstado;
    }

    return byEstado.filter((cliente) =>
      [
        cliente.nombre,
        cliente.apellido,
        cliente.email,
        cliente.telefono,
        cliente.usuario_cliente,
        String(cliente.carnet),
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }

  get totalClientes(): number {
    return this.clientes.length;
  }

  get totalActivos(): number {
    return this.clientes.filter((cliente) => cliente.estado_id === 1).length;
  }

  get totalRegistradosHoy(): number {
    const hoy = new Date();
    return this.clientes.filter((cliente) => {
      const fecha = new Date(cliente.fecha_registro);
      return fecha.getFullYear() === hoy.getFullYear()
        && fecha.getMonth() === hoy.getMonth()
        && fecha.getDate() === hoy.getDate();
    }).length;
  }

  get porcentajeActivo(): number {
    if (this.totalClientes === 0) {
      return 0;
    }
    return Math.round((this.totalActivos / this.totalClientes) * 100);
  }
}
