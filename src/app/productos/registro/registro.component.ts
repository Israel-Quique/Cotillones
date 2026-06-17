import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { NzI18nService, es_ES } from 'ng-zorro-antd/i18n';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../api.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { CommonModule } from '@angular/common';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzMessageModule } from 'ng-zorro-antd/message';

interface Productos {
  id_producto?: string;
  nombre: string;
  descripcion: string | null;
  costo_de_producto: number;
  precio_unidad: number;
  precio_cantidad: number;
  url_imagen?: string | null;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  categoria_abc?: string | null;
  categoria_abc_cantidad?: string | null;
  categoria_abc_valor?: string | null;
  puntos_abc_cantidad?: number | null;
  puntos_abc_valor?: number | null;
  cantidad_total_vendida?: number | null;
  valor_total_vendido?: number | null;
  cantidad_stock: number;
  categoria_id: string;
  temporada_id?: string | null;
  ubicacion_id?: string | number | null;
  demanda_anual?: number | null;
  costo_ordenar?: number | null;
  costo_mantenimiento?: number | null;
  eoq?: number | null;
  punto_reorden?: number | null;
  tiempo_entrega_dias?: number | null;
  stock_seguridad?: number | null;
}

interface Categoria {
  id_categoria: string;
  nombre: string;
}

interface Temporada {
  id_temporada: string;
  nombre: string;
}

interface Ubicacion {
  id_ubicacion: string;
  descripcion: string;
  codigo_qr: string;
}

@Component({
  selector: 'app-productos-registro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzUploadModule,
    NzIconModule,
    NzSelectModule,
    NzButtonModule,
    NzGridModule,
    NzMessageModule,
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit, OnChanges {
  @Input() producto: Productos | null = null;
  @Output() formSubmit = new EventEmitter<any>(); // Cambiado a 'any' ya que es un FormGroup

  registroForm: FormGroup;
  categorias: Categoria[] = [];
  temporadas: Temporada[] = [];
  ubicaciones: Ubicacion[] = [];
  selectedFile: NzUploadFile | null = null;
  previewUrl: string | null = null;
  uploading = false; // Variable para controlar el estado de la carga
  isSubmitting = false; // <<< NUEVA: Bandera para controlar el envío completo
  imageUploadFailed = false; // Nueva variable para rastrear el fallo de la carga

  constructor(
    private fb: FormBuilder,
    private i18n: NzI18nService,
    private http: HttpClient,
    private apiService: ApiService,
    private message: NzMessageService
  ) {
    this.registroForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      costo_de_producto: ['', [Validators.required, Validators.min(0)]], // Añadido validador min
      precio_unidad: ['', [Validators.required, Validators.min(0)]],     // Añadido validador min
      precio_cantidad: ['', [Validators.required, Validators.min(0)]],    // Añadido validador min
      url_imagen: [''], // Aquí se guardará la URL de la imagen desde el backend
      cantidad_stock: ['', [Validators.required, Validators.min(0)]],    // Añadido validador min
      categoria_id: ['', Validators.required],
      temporada_id: [''],
      ubicacion_id: [''],
      demanda_anual: [''],
      costo_ordenar: [''],
      costo_mantenimiento: [''],
      tiempo_entrega_dias: [3, [Validators.min(0)]],
      stock_seguridad: [0, [Validators.min(0)]],
    });
  }

  ngOnInit() {
    this.i18n.setLocale(es_ES);
    this.loadFormData();
    if (this.producto) {
      this.patchFormData(this.producto);
      this.previewUrl = this.producto.url_imagen || null;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['producto']) {
      return;
    }

    if (this.producto) {
      this.patchFormData(this.producto);
      this.previewUrl = this.producto.url_imagen || null;
      return;
    }

    this.limpiarFormulario();
    this.registroForm.patchValue({
      tiempo_entrega_dias: 3,
      stock_seguridad: 0,
    });
  }

  loadFormData() {
    this.loadCategorias();
    this.loadTemporadas();
    this.loadUbicaciones();
  }

  loadCategorias() {
    this.apiService.get<Categoria[]>('categorias').subscribe(
      (categorias) => {
        this.categorias = categorias;
      },
      (error) => {
        console.error('Error al obtener categorías:', error);
        this.message.error('Error al cargar categorías.');
      }
    );
  }

  loadTemporadas() {
    this.apiService.get<Temporada[]>('temporadas').subscribe(
      (temporadas) => {
        this.temporadas = temporadas;
      },
      (error) => {
        console.error('Error al obtener temporadas:', error);
        this.message.error('Error al cargar temporadas.');
      }
    );
  }

  loadUbicaciones() {
    this.apiService.get<Ubicacion[]>('ubicaciones').subscribe(
      (ubicaciones) => {
        this.ubicaciones = ubicaciones;
      },
      (error) => {
        console.error('Error al obtener ubicaciones:', error);
        this.message.error('Error al cargar ubicaciones.');
      }
    );
  }

  patchFormData(producto: Productos) {
    this.registroForm.patchValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      costo_de_producto: producto.costo_de_producto,
      precio_unidad: producto.precio_unidad,
      precio_cantidad: producto.precio_cantidad,
      url_imagen: producto.url_imagen,
      cantidad_stock: producto.cantidad_stock,
      categoria_id: producto.categoria_id,
      temporada_id: producto.temporada_id,
      ubicacion_id: producto.ubicacion_id,
      demanda_anual: producto.demanda_anual,
      costo_ordenar: producto.costo_ordenar,
      costo_mantenimiento: producto.costo_mantenimiento,
      tiempo_entrega_dias: producto.tiempo_entrega_dias ?? 3,
      stock_seguridad: producto.stock_seguridad ?? 0,
    });
  }

  onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target && target.files && target.files.length > 0) {
      this.selectedFile = {
        uid: target.files[0].name + '-' + Date.now(),
        name: target.files[0].name,
        size: target.files[0].size,
        type: target.files[0].type,
        originFileObj: target.files[0],
        status: 'done',
      };
      this.previewUrl = URL.createObjectURL(target.files[0]);
      this.imageUploadFailed = false; // Resetear el indicador de fallo
      // ¡ELIMINADA LA LLAMADA A this.onSubmit() AQUÍ!
    } else {
      this.selectedFile = null;
      this.previewUrl = null;
      this.imageUploadFailed = false;
    }
  }

  limpiarFormulario() {
    this.registroForm.reset();
    this.previewUrl = null;
    this.selectedFile = null;
    this.imageUploadFailed = false;
    this.isSubmitting = false; // También resetear la bandera de envío
  }

  onSubmit() {
    // Deshabilitar el botón de envío
    this.isSubmitting = true;

    if (this.registroForm.valid) {
      if (this.selectedFile) { // Si hay una imagen seleccionada, siempre intenta subirla
        this.uploadImageAndSubmitForm();
      } else {
        // Si no hay imagen seleccionada, o si es edición y no se cambió la imagen,
        // enviar el formulario directamente
        this.submitForm(this.registroForm.value);
      }
    } else {
      this.mostrarErroresFormulario();
      this.isSubmitting = false; // Re-habilitar el botón si el formulario es inválido
    }
  }

  uploadImageAndSubmitForm() {
    this.uploading = true;
    const formData = new FormData();
    formData.append('imagen', this.selectedFile?.originFileObj as File);

    this.apiService.post('/upload-imagen', formData).subscribe(
      (uploadResponse: any) => {
        this.uploading = false;
        this.message.success('Imagen subida exitosamente.');
        const finalData = { ...this.registroForm.value, url_imagen: uploadResponse.imageUrl };
        this.submitForm(finalData); // Llamar a submitForm SÓLO después de la carga exitosa
      },
      (uploadError) => {
        this.uploading = false;
        this.isSubmitting = false; // Re-habilitar el botón en caso de error de carga
        this.imageUploadFailed = true; // Marcar la carga como fallida
        console.error('Error al subir la imagen:', uploadError);
        this.message.error('Error al subir la imagen.');
      }
    );
  }

  submitForm(formData: any) {
    // Aquí es donde se realiza la llamada principal para crear/actualizar el producto
    (this.producto?.id_producto
      ? this.apiService.put(`productos/${this.producto.id_producto}`, formData)
      : this.apiService.post('productos', formData)).subscribe(
      (productResponse) => {
        console.log('Producto registrado:', productResponse);
        this.message.success(this.producto ? 'Producto actualizado exitosamente' : 'Producto registrado exitosamente');
        this.formSubmit.emit(productResponse); // Emite el formulario al padre
        this.limpiarFormulario(); // Opcional: limpiar el formulario después del éxito
        // === ÚNICA EJECUCIÓN DEL ANÁLISIS ABC AL INICIO ===
        this.apiService.actualizarABC().subscribe({
          next: (response) => {
            console.log('Análisis ABC ejecutado una vez:', response.message);
            // Una vez que el ABC se ha ejecutado, carga los productos
            //this.cargarProducto();
          },
          error: (error) => {
            console.error('Error al ejecutar el análisis ABC inicial:', error);
            // Si el ABC falla, aún así, carga los productos, aunque con categorías potencialmente desactualizadas.
            //this.cargarProducto();
          },
        });
      },
      (productError) => {
        console.error('Error al registrar/actualizar producto:', productError);
        this.message.error(this.producto ? 'Error al actualizar producto' : 'Error al registrar producto');
        this.isSubmitting = false; // Re-habilitar el botón en caso de error en el registro/actualización
      }
    );
  }

  mostrarErroresFormulario() {
    Object.keys(this.registroForm.controls).forEach(key => {
      const controlErrors = this.registroForm.get(key)?.errors;
      if (controlErrors) {
        console.log(`Errores en el campo ${key}:`, controlErrors);
      }
    });
    this.message.error('Error en el formulario. Revise los campos.');
  }
}
