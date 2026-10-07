import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzI18nService, es_ES } from 'ng-zorro-antd/i18n';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../api.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CommonModule } from '@angular/common';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';


interface UbicacionForm {
  id_ubicacion?: string;
  codigo_qr?: string;
  zona_abc: 'A' | 'B' | 'C';
  descripcion?: string;
  nivel?: number | null;
  capacidad?: number | null;
}
@Component({
  selector: 'app-registro',
  imports: [ CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
  standalone: true
})
export class RegistroComponent  implements OnInit, OnChanges {
  @Input() ubicacionParaEditar: UbicacionForm | null = null;
  @Output() formSubmit = new EventEmitter<FormGroup>();
  @Output() closeForm = new EventEmitter<void>();

  registroForm: FormGroup;
  qrCodeURL: string | null = null;

  constructor(
    private fb: FormBuilder,
    private i18n: NzI18nService,
    private http: HttpClient,
    private apiService: ApiService,
    private message: NzMessageService
  ) {
    this.registroForm = this.fb.group({
      codigo_qr: [''],
      zona_abc: ['', Validators.required],
      descripcion: [''],
      nivel: [null],
      capacidad: [null],
    });
  }

  ngOnInit(): void {
    this.i18n.setLocale(es_ES);
    this.syncFormWithUbicacion();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ubicacionParaEditar']) {
      this.syncFormWithUbicacion();
    }
  }

  onSubmit() {
    if (this.registroForm.valid) {
      this.formSubmit.emit(this.registroForm);
    } else {
      Object.values(this.registroForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.error('Por favor, complete los campos requeridos.');
    }
  }

  resetForm(): void {
    this.syncFormWithUbicacion(false);
  }

  private syncFormWithUbicacion(useEditingValues: boolean = true): void {
    this.registroForm.reset(
      useEditingValues && this.ubicacionParaEditar
        ? {
            codigo_qr: this.ubicacionParaEditar.codigo_qr || '',
            zona_abc: this.ubicacionParaEditar.zona_abc || '',
            descripcion: this.ubicacionParaEditar.descripcion || '',
            nivel: this.ubicacionParaEditar.nivel ?? null,
            capacidad: this.ubicacionParaEditar.capacidad ?? null,
          }
        : {
            codigo_qr: '',
            zona_abc: '',
            descripcion: '',
            nivel: null,
            capacidad: null,
          }
    );
  }
}
