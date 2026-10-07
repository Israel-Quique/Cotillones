import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzI18nService, es_ES } from 'ng-zorro-antd/i18n';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';

export interface Pedidos {
  id_pedido?: string;
  cliente_id: string;
  personal_id: string;
  numero_pedido: string | null;
  fecha_pedido: string;
  fecha_evento: string;
  descripcion_pedido: string | null;
  productos_pedido: string | null;
  precio_total: number;
  acuenta: number | null;
  saldo: number | null;
  terminos_condiciones: string | null;
  estado_pedido_id: number;
  requiere_flete?: boolean;
  direccion_entrega?: string | null;
  observaciones?: string | null;
}

export interface PedidoOption {
  id: string;
  label: string;
}

interface PedidoFormValue {
  cliente_id: string;
  personal_id: string;
  numero_pedido: string;
  fecha_pedido: Date | string;
  fecha_evento: Date | string;
  descripcion_pedido: string;
  productos_pedido: string;
  precio_total: number;
  acuenta: number;
  saldo: number;
  terminos_condiciones: string;
  estado_pedido_id: number;
  requiere_flete: boolean;
  direccion_entrega: string;
  observaciones: string;
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
    NzSelectModule
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit, OnChanges {
  @Input() pedido: Pedidos | null = null;
  @Input() clientes: PedidoOption[] = [];
  @Input() personal: PedidoOption[] = [];
  @Output() formSubmit = new EventEmitter<Pedidos>();

  registroForm;

  constructor(
    private fb: FormBuilder,
    private i18n: NzI18nService
  ) {
    this.registroForm = this.fb.group({
      cliente_id: ['', Validators.required],
      personal_id: ['', Validators.required],
      numero_pedido: [''],
      fecha_pedido: [null as Date | null, Validators.required],
      fecha_evento: [null as Date | null, Validators.required],
      descripcion_pedido: [''],
      productos_pedido: [''],
      precio_total: [0, [Validators.required, Validators.min(0)]],
      acuenta: [0, [Validators.min(0)]],
      saldo: [0, [Validators.min(0)]],
      terminos_condiciones: [''],
      estado_pedido_id: [1, Validators.required],
      requiere_flete: [false],
      direccion_entrega: [''],
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.i18n.setLocale(es_ES);
    this.patchForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pedido']) {
      this.patchForm();
    }
  }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      Object.values(this.registroForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const value = this.registroForm.getRawValue() as PedidoFormValue;
    const precioTotal = Number(value.precio_total) || 0;
    const acuenta = Number(value.acuenta) || 0;
    const saldoCalculado = Math.max(precioTotal - acuenta, 0);

    this.formSubmit.emit({
      id_pedido: this.pedido?.id_pedido,
      cliente_id: value.cliente_id,
      personal_id: value.personal_id,
      numero_pedido: value.numero_pedido || null,
      fecha_pedido: this.toIsoDateTime(value.fecha_pedido),
      fecha_evento: this.toIsoDate(value.fecha_evento),
      descripcion_pedido: value.descripcion_pedido || null,
      productos_pedido: value.productos_pedido || null,
      precio_total: precioTotal,
      acuenta,
      saldo: saldoCalculado,
      terminos_condiciones: value.terminos_condiciones || null,
      estado_pedido_id: Number(value.estado_pedido_id) || 1,
      requiere_flete: Boolean(value.requiere_flete),
      direccion_entrega: value.direccion_entrega || null,
      observaciones: value.observaciones || null
    });
  }

  actualizarSaldo(): void {
    const precioTotal = Number(this.registroForm.controls.precio_total.value) || 0;
    const acuenta = Number(this.registroForm.controls.acuenta.value) || 0;
    this.registroForm.controls.saldo.setValue(Math.max(precioTotal - acuenta, 0));
  }

  private patchForm(): void {
    if (!this.pedido) {
      this.registroForm.reset({
        cliente_id: '',
        personal_id: '',
        numero_pedido: '',
        fecha_pedido: null,
        fecha_evento: null,
        descripcion_pedido: '',
        productos_pedido: '',
        precio_total: 0,
        acuenta: 0,
        saldo: 0,
        terminos_condiciones: '',
        estado_pedido_id: 1,
        requiere_flete: false,
        direccion_entrega: '',
        observaciones: ''
      });
      return;
    }

    this.registroForm.reset({
      cliente_id: this.pedido.cliente_id || '',
      personal_id: this.pedido.personal_id || '',
      numero_pedido: this.pedido.numero_pedido || '',
      fecha_pedido: this.toDate(this.pedido.fecha_pedido),
      fecha_evento: this.toDate(this.pedido.fecha_evento),
      descripcion_pedido: this.pedido.descripcion_pedido || '',
      productos_pedido: this.pedido.productos_pedido || '',
      precio_total: this.pedido.precio_total || 0,
      acuenta: this.pedido.acuenta || 0,
      saldo: this.pedido.saldo || 0,
      terminos_condiciones: this.pedido.terminos_condiciones || '',
      estado_pedido_id: this.pedido.estado_pedido_id || 1,
      requiere_flete: Boolean(this.pedido.requiere_flete),
      direccion_entrega: this.pedido.direccion_entrega || '',
      observaciones: this.pedido.observaciones || ''
    });
  }

  private toDate(value: string | Date | null | undefined): Date | null {
    if (!value) {
      return null;
    }
    return value instanceof Date ? value : new Date(value);
  }

  private toIsoDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }

  private toIsoDateTime(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }
}
