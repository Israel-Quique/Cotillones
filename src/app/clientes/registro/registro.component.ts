import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core'; // Importa Input y EventEmitter
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzI18nService, es_ES } from 'ng-zorro-antd/i18n';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../api.service';
import { ClientesComponent } from '../clientes.component'; // Importa la interfaz Cliente

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
  estado_id: number; // Añadido estado_id
  carnet: number;
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NzFormModule, NzInputModule, NzDatePickerModule, NzButtonModule, NzSelectModule, NzGridModule], // NzFormModule está aquí
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})
export class RegistroComponent implements OnInit, OnChanges {
  @Input() clienteParaEditar: Cliente | null = null; // Cambiado el nombre a clienteParaEditar para mayor claridad
  @Output() formSubmit = new EventEmitter<FormGroup>();

  registroForm: FormGroup;

  constructor(private fb: FormBuilder, private i18n: NzI18nService, private http: HttpClient, private apiService: ApiService) {
    this.registroForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      telefono: ['', Validators.required],
      email: [''],
      direccion: ['', Validators.required],
      fecha_registro: [{ value: new Date(), disabled: true }],
      fecha_nacimiento: [''],
      genero: [''],
      usuario_cliente: ['', Validators.required], // Cambiado a usuario_cliente
      contrasena_cliente: ['', Validators.required], // Cambiado a contrasena_cliente
      carnet: ['', [Validators.required, Validators.pattern(/^\d+$/)]], // Requerido y solo números
    });
  }

  disabledDate = (current: Date): boolean => {
    // Aquí puedes definir la lógica para deshabilitar fechas.
    // Por ejemplo, deshabilitar fechas futuras:
    return current > new Date();
  };
  ngOnInit() {
    this.i18n.setLocale(es_ES);
    if (this.clienteParaEditar) {
      this.registroForm.patchValue(this.clienteParaEditar);
    }
    this.syncFechaRegistroState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['clienteParaEditar']) {
      return;
    }

    this.registroForm.reset();

    if (this.clienteParaEditar) {
      this.registroForm.patchValue(this.clienteParaEditar);
      this.registroForm.get('contrasena_cliente')?.clearValidators();
      this.registroForm.get('contrasena_cliente')?.updateValueAndValidity();
      this.syncFechaRegistroState();
      return;
    }

    this.registroForm.get('contrasena_cliente')?.setValidators(Validators.required);
    this.registroForm.get('contrasena_cliente')?.updateValueAndValidity();
    this.syncFechaRegistroState();
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
    }
  }
  resetForm(): void {
    this.registroForm.reset();
    if (!this.clienteParaEditar) {
      this.registroForm.get('contrasena_cliente')?.setValidators(Validators.required);
      this.registroForm.get('contrasena_cliente')?.updateValueAndValidity();
    } else {
      this.registroForm.patchValue(this.clienteParaEditar);
      this.registroForm.get('contrasena_cliente')?.clearValidators();
      this.registroForm.get('contrasena_cliente')?.updateValueAndValidity();
    }
    this.syncFechaRegistroState();
  }

  private syncFechaRegistroState(): void {
    const fechaRegistroControl = this.registroForm.get('fecha_registro');

    if (!fechaRegistroControl) {
      return;
    }

    fechaRegistroControl.disable({ emitEvent: false });
    fechaRegistroControl.setValue(
      this.clienteParaEditar?.fecha_registro ? new Date(this.clienteParaEditar.fecha_registro) : new Date(),
      { emitEvent: false }
    );
  }
}
