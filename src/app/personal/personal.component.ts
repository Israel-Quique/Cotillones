import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ApiService } from '../api.service';
import { FormsModule } from '@angular/forms';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { RegistroComponent, Personal } from './registro/registro.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-personal',
  standalone: true,
  imports: [
    SidebarComponent,
    TopbarComponent,
    FormsModule,
    NzGridModule,
    NzInputModule,
    NzFormModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    CommonModule,
    RegistroComponent,
    NzModalModule
  ],
  templateUrl: './personal.component.html',
  styleUrl: './personal.component.css'
})
export class PersonalComponent implements OnInit {
  personal: Personal[] = [];
  searchTerm = '';
  showRegistro = false;
  personalParaEditar: Personal | null = null;
  isEditing = false;

  private imageUrlBase = 'http://localhost:3000';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.cargarPersonal();
  }

  cargarPersonal() {
    this.apiService.get<Personal[]>('personal').subscribe((data) => {
      this.personal = data;
    });
  }

  openRegistro(personal?: Personal) {
    if (this.showRegistro) {
      return;
    }
    this.showRegistro = true;
    if (personal) {
      this.personalParaEditar = { ...personal };
      this.isEditing = true;
    } else {
      this.personalParaEditar = null;
      this.isEditing = false;
    }
  }

  closeRegistro() {
    this.showRegistro = false;
    this.personalParaEditar = null;
    this.isEditing = false;
  }

  onModalVisibleChange(visible: boolean): void {
    if (!visible && this.showRegistro) {
      this.closeRegistro();
    }
  }

  onSubmitRegistro(_personalData: Personal) {
    this.cargarPersonal();
    this.closeRegistro();
  }

  eliminarPersonal(id: string) {
    this.apiService.delete(`personal/${id}`).subscribe({
      next: () => {
        this.cargarPersonal();
      },
      error: (err) => console.error('Error al eliminar personal:', err)
    });
  }

  exportarAExcel(): void {
    this.apiService.exportarPersonal().subscribe((data) => {
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
      const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.guardarArchivoExcel(excelBuffer, 'lista_personal.xlsx');
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

  getFullImageUrl(relativePath: string | null): string {
    if (!relativePath) {
      return '';
    }
    const cleanRelativePath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;
    return `${this.imageUrlBase}/${cleanRelativePath}`;
  }

  get filteredPersonal(): Personal[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.personal;
    }

    return this.personal.filter((persona) =>
      [
        persona.nombre,
        persona.apellido,
        persona.email || '',
        persona.telefono || '',
        persona.usuario_personal,
        persona.tipo_usuario_id,
      ].some((value) => value.toLowerCase().includes(term))
    );
  }
}
