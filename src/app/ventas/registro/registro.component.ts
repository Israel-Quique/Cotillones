// registro.component.ts

import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms'; 
import { HttpClient } from '@angular/common/http';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzI18nService, es_ES } from 'ng-zorro-antd/i18n';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message'; 

import { ApiService } from '../../api.service';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs/operators';

// --- NUEVA INTERFAZ PARA PRODUCTO ---
export interface Producto {
  id_producto: string; // Asume que este es el ID real del producto en tu DB
  nombre: string;
  precio_unidad?: number;
  qr_producto?: string | null;
  codigo_qr?: string | null;
}

// Definiciones de interfaces existentes
export interface ProductoVendido {
  productoId: string; // Este es el ID del producto que se venderá
  cantidad: number;
  precioUnitario: number;
  costoUnitario?: number | null;
}

export interface Venta {
  id_venta?: string;
  clienteId: string;
  personalId: string;
  fechaVenta: Date | string;
  total: number;
  productos: ProductoVendido[];
  notas?: string | null;
}

interface Cliente {
  id_cliente: string;
  nombre: string;
  apellido: string;
  carnet: string;
}

export interface Personal {
  id_personal: string;
  nombre: string;
  apellido: string;
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
    NzSelectModule, // ¡Asegúrate de que está importado!
    NzGridModule,
    NzInputNumberModule,
    NzIconModule,
    NzToolTipModule
  ],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit, OnDestroy, OnChanges {

  @Input() ventaParaEditar: Venta | null = null;
  @Output() formSubmit = new EventEmitter<Venta>();

  ventaForm: FormGroup;
  carnetClienteStatus: 'valid' | 'invalid' | 'checking' | null = null;
  clienteEncontrado: Cliente | null = null;

  personalList: Personal[] = [];
  // --- NUEVA PROPIEDAD PARA LA LISTA DE PRODUCTOS ---
  productosDisponibles: Producto[] = []; 
  private destroy$ = new Subject<void>();
  qrScannerSupported = false;
  scanningIndex: number | null = null;
  qrManualCode = '';
  private qrStream: MediaStream | null = null;
  private qrScanInterval: ReturnType<typeof setInterval> | null = null; 

  constructor(
    private fb: FormBuilder,
    private i18n: NzI18nService,
    private http: HttpClient, 
    private apiService: ApiService,
    private message: NzMessageService 
  ) {
    this.ventaForm = this.fb.group({
      id_venta: [{ value: '', disabled: true }],
      carnetCliente: ['', Validators.required], 
      clienteId: [{ value: '', disabled: true }], 
      personalId: ['', Validators.required],
      fechaVenta: [new Date(), Validators.required],
      total: [null, [Validators.required, Validators.min(0)]],
      productos: this.fb.array([this.crearProductoFormGroup()]),
      notas: [''],
    });
    this.qrScannerSupported =
      typeof window !== 'undefined' &&
      'BarcodeDetector' in window &&
      !!navigator.mediaDevices?.getUserMedia;
  }

  ngOnInit(): void {
    this.i18n.setLocale(es_ES);
    this.loadPersonalList(); 
    // --- CARGAR LISTA DE PRODUCTOS AL INICIAR ---
    this.loadProductosDisponibles(); 

    if (this.ventaParaEditar) {
      this.patchFormData(this.ventaParaEditar); 
    } else {
      this.ventaForm.get('id_venta')?.enable();
      this.ventaForm.get('id_venta')?.setValue('');
      this.ventaForm.get('fechaVenta')?.setValue(new Date());
    }

    this.carnetClienteControl.valueChanges 
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap(carnet => {
          if (carnet && typeof carnet === 'string' && carnet.length > 0) {
            this.carnetClienteStatus = 'checking';
            this.clienteEncontrado = null;
            this.ventaForm.get('clienteId')?.setValue('');
            return this.apiService.get<Cliente>(`clientes/buscar-por-carnet/${carnet}`).pipe(
              catchError(error => {
                if (error.status === 404) {
                  return of(null);
                }
                console.error('Error al verificar cliente por carnet:', error);
                this.message.error('Error al buscar el cliente.');
                return of(null);
              })
            );
          } else {
            this.carnetClienteStatus = null;
            this.clienteEncontrado = null;
            this.ventaForm.get('clienteId')?.setValue('');
            return of(null);
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.carnetClienteStatus = 'valid';
            this.clienteEncontrado = response;
            this.ventaForm.get('clienteId')?.setValue(this.clienteEncontrado.id_cliente);
            this.carnetClienteControl.setErrors(null); 
          } else {
            this.carnetClienteStatus = 'invalid';
            this.clienteEncontrado = null;
            this.ventaForm.get('clienteId')?.setValue('');
            this.carnetClienteControl.setErrors({ 'clienteNoExiste': true }); 
          }
        },
        error: (err) => {
          console.error('Error en la suscripción de carnetCliente:', err);
          this.carnetClienteStatus = 'invalid';
          this.clienteEncontrado = null;
          this.ventaForm.get('clienteId')?.setValue('');
          this.carnetClienteControl.setErrors({ 'clienteNoExiste': true, 'apiError': true }); 
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['ventaParaEditar'] || !this.ventaForm) {
      return;
    }

    if (this.ventaParaEditar) {
      this.patchFormData(this.ventaParaEditar);
      return;
    }

    this.resetForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next(); 
    this.destroy$.complete();
    this.stopQrScanner();
  }

  get carnetClienteControl(): FormControl {
    return this.ventaForm.get('carnetCliente') as FormControl;
  }

  patchFormData(venta: Venta) {
    this.ventaForm.patchValue({
      id_venta: venta.id_venta,
      personalId: venta.personalId,
      fechaVenta: venta.fechaVenta ? new Date(venta.fechaVenta) : new Date(),
      total: venta.total,
      notas: venta.notas
    });

    if (venta.clienteId) {
      this.apiService.get<Cliente>(`clientes/${venta.clienteId}`).subscribe({
        next: (cliente) => {
          this.clienteEncontrado = cliente;
          this.carnetClienteStatus = 'valid';
          this.ventaForm.get('carnetCliente')?.setValue(cliente.carnet); 
          this.ventaForm.get('clienteId')?.setValue(cliente.id_cliente); 
        },
        error: (err) => {
          console.error('Error al cargar cliente para edición:', err);
          this.clienteEncontrado = null;
          this.carnetClienteStatus = 'invalid';
          this.ventaForm.get('clienteId')?.setValue('');
          this.message.error('No se pudo cargar el cliente para edición.');
        }
      });
    }

    this.productosFormArray.clear();
    if (venta.productos && venta.productos.length > 0) {
      venta.productos.forEach(producto => {
        this.productosFormArray.push(this.crearProductoFormGroup(producto));
      });
    } else {
      this.productosFormArray.push(this.crearProductoFormGroup());
    }
    this.ventaForm.get('id_venta')?.disable(); 
  }

  private loadPersonalList(): void {
    this.apiService.get<Personal[]>('personal').pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error al cargar la lista de personal:', error);
        this.message.error('Error al cargar la lista de personal.');
        return of([]);
      })
    ).subscribe(personal => {
      this.personalList = personal;
    });
  }

  // --- NUEVA FUNCIÓN PARA CARGAR PRODUCTOS DISPONIBLES ---
  private loadProductosDisponibles(): void {
    // Asume que tu API tiene un endpoint para obtener todos los productos
    this.apiService.get<Producto[]>('productos').pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error al cargar la lista de productos:', error);
        this.message.error('Error al cargar la lista de productos disponibles.');
        return of([]);
      })
    ).subscribe(productos => {
      this.productosDisponibles = productos;
    });
  }

  get productosFormArray(): FormArray {
    return this.ventaForm.get('productos') as FormArray;
  }

  crearProductoFormGroup(producto?: ProductoVendido): FormGroup {
    return this.fb.group({
      // Ahora, `productoId` se llenará con el `id_producto` del `nz-select`
      productoId: [producto ? producto.productoId : null, Validators.required],
      cantidad: [producto ? producto.cantidad : null, [Validators.required, Validators.min(1)]],
      precioUnitario: [producto ? producto.precioUnitario : null, [Validators.required, Validators.min(0)]],
      costoUnitario: [producto ? producto.costoUnitario : null, Validators.min(0)],
    });
  }

  agregarProducto(): void {
    this.productosFormArray.push(this.crearProductoFormGroup());
  }

  eliminarProducto(index: number): void {
    if (this.productosFormArray.length > 1) {
      this.productosFormArray.removeAt(index);
    } else {
      this.message.warning('Debe haber al menos un producto en la venta.');
    }
  }

  async iniciarEscaneoQr(index: number): Promise<void> {
    if (!this.qrScannerSupported) {
      this.message.warning('Tu dispositivo o navegador no soporta escaneo QR con camara.');
      return;
    }

    this.stopQrScanner();
    this.scanningIndex = index;
    this.qrManualCode = '';

    try {
      this.qrStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      const video = document.getElementById('qr-video') as HTMLVideoElement | null;
      if (!video) {
        throw new Error('No se encontro el visor de camara.');
      }

      video.srcObject = this.qrStream;
      await video.play();

      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      this.qrScanInterval = setInterval(async () => {
        if (!video || video.readyState < 2 || this.scanningIndex === null) {
          return;
        }
        try {
          const codes = await detector.detect(video);
          if (codes?.length) {
            const value = String(codes[0].rawValue || '').trim();
            if (value) {
              this.aplicarCodigoQr(value, this.scanningIndex);
              this.stopQrScanner();
            }
          }
        } catch {
          // Ignorar errores transitorios.
        }
      }, 350);
    } catch (error) {
      console.error('No se pudo iniciar el escaneo QR:', error);
      this.message.error('No se pudo abrir la camara para escanear QR.');
      this.stopQrScanner();
    }
  }

  detenerEscaneoQr(): void {
    this.stopQrScanner();
  }

  aplicarCodigoManualQr(index: number): void {
    const code = this.qrManualCode.trim();
    if (!code) {
      this.message.warning('Ingresa un codigo QR para buscar el producto.');
      return;
    }
    this.aplicarCodigoQr(code, index);
  }

  private aplicarCodigoQr(qrValue: string, index: number): void {
    const line = this.productosFormArray.at(index) as FormGroup;
    const normalized = qrValue.trim().toLowerCase();

    let producto = this.productosDisponibles.find((p) => String(p.id_producto).toLowerCase() === normalized);

    if (!producto) {
      producto = this.productosDisponibles.find((p) => {
        const codigo = String(p.codigo_qr || '').toLowerCase();
        const qrRaw = String(p.qr_producto || '').toLowerCase();
        return codigo === normalized || qrRaw.includes(normalized);
      });
    }

    if (!producto) {
      try {
        const parsed = JSON.parse(qrValue);
        const id = String(parsed?.id_producto || parsed?.productoId || parsed?.id || '').trim();
        if (id) {
          producto = this.productosDisponibles.find((p) => String(p.id_producto) === id);
        }
      } catch {
        // QR plano no JSON
      }
    }

    if (!producto) {
      this.message.warning('No se encontro producto para ese QR.');
      return;
    }

    line.patchValue({
      productoId: producto.id_producto,
      precioUnitario: producto.precio_unidad ?? line.get('precioUnitario')?.value ?? 0,
    });
    this.message.success(`Producto detectado: ${producto.nombre}`);
  }

  private stopQrScanner(): void {
    if (this.qrScanInterval) {
      clearInterval(this.qrScanInterval);
      this.qrScanInterval = null;
    }
    if (this.qrStream) {
      this.qrStream.getTracks().forEach((track) => track.stop());
      this.qrStream = null;
    }
    const video = document.getElementById('qr-video') as HTMLVideoElement | null;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
    this.scanningIndex = null;
  }

  onSubmit(): void {
    this.markAllAsDirty(this.ventaForm); 

    if (this.ventaForm.valid && this.carnetClienteStatus === 'valid' && this.clienteEncontrado?.id_cliente) {
      const formValue: Venta = this.ventaForm.getRawValue();

      if (formValue.fechaVenta instanceof Date) {
        formValue.fechaVenta = formValue.fechaVenta.toISOString();
      }

      const ventaFinal: Venta = {
        clienteId: this.clienteEncontrado.id_cliente, 
        personalId: formValue.personalId,
        fechaVenta: formValue.fechaVenta,
        total: formValue.total,
        productos: formValue.productos,
        notas: formValue.notas
      };

      if (this.ventaParaEditar?.id_venta) {
        ventaFinal.id_venta = this.ventaParaEditar.id_venta;
      }

      console.log('Formulario de venta enviado:', ventaFinal);
      this.formSubmit.emit(ventaFinal); 

    } else {
      console.warn('El formulario es inválido o el cliente no ha sido verificado correctamente.');
      if (this.carnetClienteStatus === 'invalid') {
        this.message.error('El número de carnet ingresado no corresponde a un cliente existente.');
      } else if (this.carnetClienteStatus === 'checking') {
        this.message.warning('Por favor, espere a que se complete la verificación del carnet.');
      } else if (this.carnetClienteControl.errors?.['required']) { 
        this.message.error('Por favor, ingrese el número de carnet del cliente.');
      } else if (!this.clienteEncontrado?.id_cliente) {
        this.message.error('Debe seleccionar un cliente válido para la venta.');
      } else {
        this.message.error('Por favor, complete todos los campos requeridos y asegúrese de que el carnet del cliente sea válido.');
      }
    }
  }

  private markAllAsDirty(control: AbstractControl): void {
    if (control instanceof FormGroup || control instanceof FormArray) {
      Object.values(control.controls).forEach(subControl => {
        this.markAllAsDirty(subControl);
      });
    } else {
      control.markAsDirty();
      control.updateValueAndValidity({ onlySelf: true });
    }
  }

  resetForm(): void {
    this.ventaForm.reset();
    this.productosFormArray.clear();
    this.productosFormArray.push(this.crearProductoFormGroup());
    this.ventaForm.get('fechaVenta')?.setValue(new Date());
    this.ventaForm.get('total')?.setValue(0);
    this.ventaForm.get('id_venta')?.enable(); 
    this.ventaForm.get('id_venta')?.setValue('');
    this.carnetClienteStatus = null;
    this.clienteEncontrado = null;
    this.ventaForm.get('clienteId')?.setValue('');
    this.carnetClienteControl.setErrors(null); 
  }
}

