import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ApiService } from '../api.service';
import { FormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import * as XLSX from 'xlsx';
import { RegistroComponent } from './registro/registro.component'; // Importa RegistroComponent
import { saveAs } from 'file-saver'; // Importa la librería file-saver

export interface Ubicacion {
  id_ubicacion: string;
  codigo_qr: string;
  zona_abc: 'A' | 'B' | 'C';
  descripcion?: string;
  nivel?: number;
  capacidad?: number;
  fecha_registro?: string;
}

@Component({
  selector: 'app-estante',
  standalone: true,
  imports: [SidebarComponent,
    TopbarComponent,
    FormsModule,
    NzGridModule,
    NzInputModule,
    NzFormModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    CommonModule,
    RegistroComponent // Importa RegistroComponent aquí
  ],
  templateUrl: './estante.component.html',
  styleUrl: './estante.component.css'
})
export class EstanteComponent implements OnInit {
  ubicaciones: Ubicacion[] = []; // Cambia el nombre del array a ubicaciones
  searchTerm = '';
  showRegistro = false; // Muestra/oculta el formulario de registro
  showLista = true;   // Muestra/oculta la lista
  editarUbicacion: Ubicacion | null = null; // Para la edición
  isEditing = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.cargarUbicaciones();
  }

  cargarUbicaciones() {
    this.apiService.get<Ubicacion[]>('ubicaciones').subscribe((data) => {
      this.ubicaciones = data;
    });
  }

  openRegistro(ubicacion?: Ubicacion) {
    this.showRegistro = true;
    this.showLista = false;
    if (ubicacion) {
      this.editarUbicacion = { ...ubicacion };
      this.isEditing = true;
    } else {
      this.editarUbicacion = null;
      this.isEditing = false;
    }
  }

  get filteredUbicaciones(): Ubicacion[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.ubicaciones;
    }

    return this.ubicaciones.filter((ubicacion) =>
      [
        ubicacion.id_ubicacion,
        ubicacion.zona_abc,
        ubicacion.descripcion || '',
        String(ubicacion.nivel ?? ''),
        String(ubicacion.capacidad ?? '')
      ].some((value) => value.toLowerCase().includes(term))
    );
  }

  closeRegistro() {
    this.showRegistro = false;
    this.showLista = true;
    this.editarUbicacion = null;
    this.isEditing = false;
  }

  onSubmitRegistro(formValue: FormGroup) {
    if (formValue.valid) {
      if (this.isEditing && this.editarUbicacion) {
        this.apiService
          .put<Ubicacion>(`ubicaciones/${this.editarUbicacion.id_ubicacion}`, formValue.value)
          .subscribe(() => {
            this.cargarUbicaciones();
            this.closeRegistro();
          });
      } else {
        this.apiService.post<Ubicacion>('ubicaciones', formValue.value).subscribe(() => {
          this.cargarUbicaciones();
          this.closeRegistro();
        });
      }
    } else {
      Object.values(formValue.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  eliminarUbicacion(id: string) {
    this.apiService.delete(`ubicaciones/${id}`).subscribe(() => {
      this.cargarUbicaciones();
    });
  }

  exportarAExcel(): void {
    // Adapta esto para exportar ubicaciones si es necesario
    const exportData = this.ubicaciones.map(ubicacion => ({
      'ID Ubicación': ubicacion.id_ubicacion,
      'Código QR': ubicacion.codigo_qr,
      'Zona ABC': ubicacion.zona_abc,
      'Descripción': ubicacion.descripcion,
      'Nivel': ubicacion.nivel,
      'Capacidad': ubicacion.capacidad,
      'Fecha Registro': ubicacion.fecha_registro
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.guardarArchivoExcel(excelBuffer, 'lista_Ubicaciones.xlsx');
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

  exportarQR(qrDataUrl: string, ubicacionId: string): void {
    if (qrDataUrl) {
      // Extraer el tipo de archivo y los datos Base64 de la URL
      const parts = qrDataUrl.split(',');
      const mimeType = parts[0].split(':')[1].split(';')[0];
      const base64Data = parts[1];

      // Convertir los datos Base64 a un Blob
      const byteString = atob(base64Data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeType });

      // Crear un nombre de archivo para la descarga
      const filename = `qr_ubicacion_${ubicacionId || 'sin_id'}.png`; // Puedes ajustar el nombre y la extensión

      // Utilizar file-saver para iniciar la descarga
      saveAs(blob, filename);
    } else {
      console.warn('No se encontró información del código QR para exportar.');
      // Opcionalmente, mostrar un mensaje al usuario
    }
  }
}
