import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzI18nService, es_ES } from 'ng-zorro-antd/i18n';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../api.service'; // Asegúrate de que esta ruta sea correcta
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { CommonModule } from '@angular/common';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';

// --- INTERFACES ---
export interface ProveedorProducto {
  id_proveedor_producto?: string;
  nombre: string;
  nombre_contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  estado_proveedor_id: number;
}

// **INTERFAZ ACTUALIZADA PARA COINCIDIR CON LA RESPUESTA DE LA API**
interface EstadoProveedor {
  id_estado_proveedor: number; // Propiedad 'id' ahora es 'id_estado_proveedor'
  nombre_estado: string;      // Propiedad 'nombre' ahora es 'nombre_estado'
  descripcion_estado: string | null; // Añadida la propiedad 'descripcion_estado'
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzSelectModule,
    NzButtonModule,
    NzGridModule,
    NzIconModule,
    HttpClientModule,
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit, OnChanges {
  @Input() proveedor: ProveedorProducto | null = null;
  @Output() formSubmit = new EventEmitter<any>();

  registroForm: FormGroup;
  estadosProveedor: EstadoProveedor[] = [];
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private i18n: NzI18nService,
    private http: HttpClient,
    private apiService: ApiService,
    private message: NzMessageService
  ) {
    this.registroForm = this.fb.group({
      nombre: ['', Validators.required],
      nombre_contacto: [''],
      telefono: [''],
      email: ['', Validators.email],
      direccion: [''],
      notas: [''],
      estado_proveedor_id: [null, Validators.required],
    });
  }

  ngOnInit() {
    this.i18n.setLocale(es_ES);
    console.log('[RegistroComponent] ngOnInit: Inicializando componente.');
    this.loadFormData();
    if (this.proveedor) {
      this.patchFormData(this.proveedor);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['proveedor']) {
      return;
    }

    this.registroForm.reset({
      nombre: '',
      nombre_contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      notas: '',
      estado_proveedor_id: null,
    });

    if (this.proveedor) {
      this.registroForm.patchValue(this.proveedor);
    }
  }

  loadFormData() {
    console.log('[RegistroComponent] loadFormData: Cargando datos del formulario...');
    this.loadEstadosProveedor();
  }

  loadEstadosProveedor() {
    console.log('[RegistroComponent] loadEstadosProveedor: Realizando llamada a la API para obtener estados de proveedor...');
    this.apiService.get<EstadoProveedor[]>('estados-proveedor').subscribe({
      next: (estados) => {
        console.log('[RegistroComponent] loadEstadosProveedor: Datos recibidos de la API:', estados);
        // **Validación mejorada para el nuevo formato**:
        if (Array.isArray(estados) && estados.every(e => 'id_estado_proveedor' in e && 'nombre_estado' in e)) {
          this.estadosProveedor = estados;
          console.log('[RegistroComponent] loadEstadosProveedor: Estados de proveedor asignados:', this.estadosProveedor);
          if (this.registroForm.get('estado_proveedor_id')?.value) {
            this.registroForm.get('estado_proveedor_id')?.updateValueAndValidity();
          }
        } else {
          console.error('[RegistroComponent] loadEstadosProveedor: La API devolvió un formato de datos inesperado para estadosProveedor. Se esperaba {id_estado_proveedor, nombre_estado}:', estados);
          this.message.error('Error: El formato de datos de los estados del proveedor no es el esperado. Contacte al administrador.');
          this.estadosProveedor = [];
        }
      },
      error: (err) => {
        console.error('[RegistroComponent] loadEstadosProveedor: Error al obtener estados de proveedor:', err);
        this.message.error('Error al cargar estados de proveedor. Verifique la consola del navegador para más detalles.');
        this.estadosProveedor = [];
      },
      complete: () => {
        console.log('[RegistroComponent] loadEstadosProveedor: Llamada a la API de estados de proveedor completada.');
      }
    });
  }

  patchFormData(proveedor: ProveedorProducto) {
    console.log('[RegistroComponent] patchFormData: Aplicando datos del proveedor al formulario:', proveedor);
    this.registroForm.patchValue({
      nombre: proveedor.nombre,
      nombre_contacto: proveedor.nombre_contacto,
      telefono: proveedor.telefono,
      email: proveedor.email,
      direccion: proveedor.direccion,
      notas: proveedor.notas,
      estado_proveedor_id: proveedor.estado_proveedor_id,
    });
    if (this.registroForm.get('estado_proveedor_id')?.value) {
        this.registroForm.get('estado_proveedor_id')?.updateValueAndValidity();
    }
  }

  limpiarFormulario() {
    this.registroForm.reset();
    this.isSubmitting = false;
    this.message.info('Formulario limpiado.');
    console.log('[RegistroComponent] Formulario limpiado.');
  }

  onSubmit() {
    this.isSubmitting = true;
    console.log('[RegistroComponent] onSubmit: Intentando enviar formulario. Estado válido:', this.registroForm.valid, 'Valor:', this.registroForm.value);

    if (this.registroForm.valid) {
      const formData: ProveedorProducto = this.registroForm.value;

      if (this.proveedor && this.proveedor.id_proveedor_producto) {
        console.log('[RegistroComponent] onSubmit: Actualizando proveedor con ID:', this.proveedor.id_proveedor_producto, 'Datos:', formData);
        this.apiService.put(`/proveedores-producto/${this.proveedor.id_proveedor_producto}`, formData).subscribe({
          next: (response) => {
            console.log('[RegistroComponent] Proveedor actualizado:', response);
            this.message.success('Proveedor actualizado exitosamente.');
            this.formSubmit.emit(response);
            this.limpiarFormulario();
          },
          error: (error) => {
            console.error('[RegistroComponent] Error al actualizar proveedor:', error);
            this.message.error('Error al actualizar proveedor.');
            this.isSubmitting = false;
          }
        });
      } else {
        console.log('[RegistroComponent] onSubmit: Registrando nuevo proveedor. Datos:', formData);
        this.apiService.post('proveedores-producto', formData).subscribe({
          next: (response) => {
            console.log('[RegistroComponent] Proveedor registrado:', response);
            this.message.success('Proveedor registrado exitosamente.');
            this.formSubmit.emit(response);
            this.limpiarFormulario();
          },
          error: (error) => {
            console.error('[RegistroComponent] Error al registrar proveedor:', error);
            this.message.error('Error al registrar proveedor.');
            this.isSubmitting = false;
          }
        });
      }
    } else {
      this.mostrarErroresFormulario();
      this.isSubmitting = false;
      this.message.warning('Por favor, complete todos los campos requeridos y corrija los errores.');
    }
  }

  mostrarErroresFormulario() {
    console.log('[RegistroComponent] Validando campos del formulario y marcando errores...');
    Object.keys(this.registroForm.controls).forEach(key => {
      const control = this.registroForm.get(key);
      if (control && control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
        console.log(`[RegistroComponent] Errores en el campo '${key}':`, control.errors);
      }
    });
    this.message.error('Error en el formulario. Revise los campos requeridos y el formato.');
  }
}
