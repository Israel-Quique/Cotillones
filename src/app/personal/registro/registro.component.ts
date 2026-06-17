import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzI18nService, es_ES } from 'ng-zorro-antd/i18n';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../api.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzUploadFile } from 'ng-zorro-antd/upload'; // Importa NzUploadFile para el tipo de archivo
import { NzUploadModule } from 'ng-zorro-antd/upload'; // Importar NzUploadModule para el HTML
import { NzSwitchModule } from 'ng-zorro-antd/switch';

// Interface para los datos del personal
export interface Personal {
  id_personal?: string;
  tipo_usuario_id: string;
  estado_personal_id?: number;
  usuario_personal: string;
  contrasena_personal?: string;
  email?: string | null;
  telefono?: string | null;
  nombre: string;
  apellido: string;
  fecha_registro?: string;
  activo?: boolean;
  imagen_perfil?: string | null; // Cambiado a string | null para la URL base64 o de archivo
}

// Interface para el tipo de usuario (asumiendo que lo necesitas para el select)
export interface TipoUsuario {
  id_tipo_usuario: string;
  nombre: string;
  descripcion?: string; // Agrega la descripción si la necesitas en el frontend
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
    NzButtonModule,
    NzSelectModule,
    NzIconModule,
    NzUploadModule,
    NzSwitchModule
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})
export class RegistroComponent implements OnInit, OnChanges {

  @Input() personalParaEditar: Personal | null = null;
  @Output() formSubmit = new EventEmitter<Personal>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  registroPersonalForm!: FormGroup;
  selectedFile: NzUploadFile | null = null;
  previewUrl: string | null = null;
  uploading: boolean = false;
  imageUploadFailed: boolean = false; // Nueva variable para rastrear el fallo de la carga
  tiposUsuario: TipoUsuario[] = []; // Array para almacenar los tipos de usuario

  constructor(
    private fb: FormBuilder,
    private i18n: NzI18nService,
    private http: HttpClient,
    private apiService: ApiService,
    private message: NzMessageService
  ) { }

  ngOnInit() {
    this.i18n.setLocale(es_ES);
    this.initForm();
    this.loadTiposUsuario(); // Cargar los tipos de usuario al inicializar
    this.patchFormValues();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['personalParaEditar'] && this.registroPersonalForm) {
      this.patchFormValues();
    }
  }

  initForm(): void {
    this.registroPersonalForm = this.fb.group({
      nombre: [null, [Validators.required]],
      apellido: [null, [Validators.required]],
      email: [null, [Validators.email]],
      telefono: [null],
      usuario_personal: [null, [Validators.required]],
      contrasena_personal: [null, [Validators.required, Validators.minLength(6)]],
      tipo_usuario_id: [null, [Validators.required]],
      imagen_perfil: [null],
      estado_personal_id: [1, [Validators.required]],
      activo: [true]
    });
  }

  patchFormValues(): void {
    if (this.personalParaEditar) {
      this.registroPersonalForm.patchValue({
        nombre: this.personalParaEditar.nombre,
        apellido: this.personalParaEditar.apellido,
        email: this.personalParaEditar.email,
        telefono: this.personalParaEditar.telefono,
        usuario_personal: this.personalParaEditar.usuario_personal,
        tipo_usuario_id: this.personalParaEditar.tipo_usuario_id,
        estado_personal_id: this.personalParaEditar.estado_personal_id ?? (this.personalParaEditar.activo === false ? 2 : 1),
        activo: this.personalParaEditar.activo ?? true,
      });

      if (this.personalParaEditar.imagen_perfil) {
        this.previewUrl = this.personalParaEditar.imagen_perfil;
        this.registroPersonalForm.get('imagen_perfil')?.setValue(this.personalParaEditar.imagen_perfil);
      } else {
        this.previewUrl = null;
        this.registroPersonalForm.get('imagen_perfil')?.setValue(null);
      }

      // Eliminar el validador de contraseña si se está editando y no se proporciona una nueva
      this.registroPersonalForm.get('contrasena_personal')?.setValidators(null);
      this.registroPersonalForm.get('contrasena_personal')?.updateValueAndValidity();
    } else {
      // Restaurar el validador de contraseña para nuevas entradas
      this.registroPersonalForm.get('contrasena_personal')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.registroPersonalForm.get('contrasena_personal')?.updateValueAndValidity();
      this.registroPersonalForm.reset();
      this.registroPersonalForm.patchValue({
        estado_personal_id: 1,
        activo: true,
      });
      this.previewUrl = null;
      this.selectedFile = null;
      this.imageUploadFailed = false; // Resetear el estado al limpiar para nueva entrada
    }
  }

  onActivoChange(isActive: boolean | Event): void {
    const activo = typeof isActive === 'boolean' ? isActive : ((isActive as any)?.target?.checked ?? false);
    this.registroPersonalForm.patchValue({
      activo,
      estado_personal_id: activo ? 1 : 2,
    });
  }

  /**
   * Carga los tipos de usuario desde la API y los asigna al array 'tiposUsuario'.
   * Muestra un mensaje de error si la carga falla.
   */
  loadTiposUsuario(): void {
    // El endpoint '/tipos-usuario' es el correcto para obtener la lista de tipos de usuario
    this.apiService.get<TipoUsuario[]>('tipos-usuario').subscribe(
      (data: TipoUsuario[]) => {
        this.tiposUsuario = data;
        console.log('Tipos de usuario cargados:', this.tiposUsuario);
      },
      (error) => {
        console.error('Error al cargar tipos de usuario:', error);
        this.message.error('Error al cargar los tipos de usuario. Intente nuevamente más tarde.');
      }
    );
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile = {
        uid: file.name + '-' + Date.now(),
        name: file.name,
        size: file.size,
        type: file.type,
        originFileObj: file,
        status: 'done',
      };

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
      this.imageUploadFailed = false; // Resetear el indicador de fallo al seleccionar un nuevo archivo
    } else {
      this.selectedFile = null;
      this.previewUrl = null;
      this.imageUploadFailed = false; // Resetear el indicador de fallo si no hay archivo
    }
  }

  clearImage(): void {
    this.previewUrl = null;
    this.selectedFile = null;
    this.registroPersonalForm.get('imagen_perfil')?.setValue(null);
    this.message.info('Imagen de perfil eliminada.');
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = ''; // Limpiar el input de tipo file
    }
    this.imageUploadFailed = false; // Resetear el estado al limpiar la imagen
  }

  onSubmit(): void {
    // Marcar todos los controles como touched y dirty para que se muestren los errores
    Object.values(this.registroPersonalForm.controls).forEach(control => {
      control.markAsTouched();
      control.markAsDirty();
      control.updateValueAndValidity();
    });

    if (this.registroPersonalForm.valid) {
      if (this.selectedFile && !this.imageUploadFailed) {
        this.uploadImageAndSubmitPersonalForm(); // Subir imagen antes de enviar el formulario
      } else if (!this.selectedFile) {
        // Si no hay imagen seleccionada, enviar el formulario directamente
        // Esto también cubre el caso de edición donde la imagen existente no se cambia
        this.submitPersonalForm();
      } else {
        // Si imageUploadFailed es true
        this.message.error('La carga de la imagen falló. Por favor, inténtelo de nuevo.');
      }
    } else {
      this.message.error('Por favor, complete todos los campos obligatorios y corrija los errores.');
    }
  }

  private uploadImageAndSubmitPersonalForm(): void {
    this.uploading = true;
    const formData = new FormData();
    // Asegúrate de que 'imagen_perfil' coincida con el nombre que espera tu backend
    formData.append('imagen_perfil', this.selectedFile?.originFileObj as File);

    // Endpoint para subir imágenes de personal (puede ser diferente al de productos)
    this.apiService.post<{ imageUrl: string }>('/upload-imagen-personal', formData).subscribe(
      (uploadResponse) => {
        this.uploading = false;
        this.message.success('Imagen de perfil subida exitosamente.');
        const imageUrl = uploadResponse.imageUrl;
        this.registroPersonalForm.get('imagen_perfil')?.setValue(imageUrl); // Establece la URL devuelta por el backend
        this.submitPersonalForm(); // Ahora envía el formulario de personal con la URL de la imagen
      },
      (uploadError) => {
        this.uploading = false;
        this.imageUploadFailed = true; // Marcar la carga como fallida
        console.error('Error al subir la imagen de perfil:', uploadError);
        this.message.error('Error al subir la imagen de perfil. El personal no se registrará/actualizará.');
        // Puedes optar por no llamar a submitPersonalForm si la imagen es obligatoria
      }
    );
  }

  private submitPersonalForm(): void {
    const formValue = this.registroPersonalForm.value;

    // Si se está editando y no se ha cambiado la contraseña, no la envíes
    if (this.personalParaEditar && !formValue.contrasena_personal) {
      delete formValue.contrasena_personal;
    }

    const personalData: Personal = {
      ...(this.personalParaEditar && { id_personal: this.personalParaEditar.id_personal }),
      ...formValue,
      activo: formValue.activo ?? true,
      estado_personal_id: formValue.estado_personal_id ?? ((formValue.activo ?? true) ? 1 : 2),
    };

    // Asegúrate de que imagen_perfil sea null si no hay previewUrl y no hay archivo seleccionado
    if (!this.previewUrl && !this.selectedFile) {
      personalData.imagen_perfil = null;
    }

    if (this.personalParaEditar) {
      this.apiService.put<Personal>(`personal/${this.personalParaEditar.id_personal}`, personalData).subscribe(
        (response: Personal) => {
          this.uploading = false;
          this.message.success('Personal actualizado exitosamente.');
          this.formSubmit.emit(response); // Emitir el personal actualizado
          this.onReset();
        },
        (error) => {
          this.uploading = false;
          console.error('Error al actualizar personal:', error);
          this.message.error('Error al actualizar personal.');
        }
      );
    } else {
      this.apiService.post<Personal>('personal', personalData).subscribe(
        (response: Personal) => {
          this.uploading = false;
          this.message.success('Personal registrado exitosamente.');
          this.formSubmit.emit(response); // Emitir el nuevo personal
          this.onReset();
        },
        (error) => {
          this.uploading = false;
          console.error('Error al registrar personal:', error);
          this.message.error('Error al registrar personal.');
        }
      );
    }
  }

  onReset(): void {
    this.registroPersonalForm.reset();
    // Restaurar el validador de contraseña si el formulario no está en modo edición
    this.registroPersonalForm.get('contrasena_personal')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.registroPersonalForm.get('contrasena_personal')?.updateValueAndValidity();
    this.registroPersonalForm.patchValue({
      estado_personal_id: 1,
      activo: true,
    });

    this.previewUrl = null;
    this.selectedFile = null;
    this.imageUploadFailed = false; // Resetear el estado de fallo de imagen
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
    this.message.info('Formulario limpiado.');
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private markFormControlsAsDirty(): void {
    Object.values(this.registroPersonalForm.controls).forEach(control => {
      if (control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }
}
