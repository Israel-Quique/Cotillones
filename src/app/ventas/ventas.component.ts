import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { HttpClientModule } from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ApiService } from '../api.service';
import * as XLSX from 'xlsx';
import { Venta, ProductoVendido, RegistroComponent } from './registro/registro.component';
import { Subscription, timer } from 'rxjs';
import { RealtimeSyncService } from '../realtime-sync.service';

interface VentaApiResponse {
  id_venta?: string;
  cliente_id: string;
  personal_id: string;
  fecha_venta: string;
  total: number;
  productos_vendidos: ProductoVendido[];
  notas?: string | null;
}

interface Cliente {
  id_cliente?: string;
  nombre_cliente: string;
}

interface Personal {
  id_personal?: string;
  nombre_personal: string;
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    FormsModule,
    NzInputModule,
    NzGridModule,
    HttpClientModule,
    SidebarComponent,
    TopbarComponent,
    DatePipe,
    CurrencyPipe,
    RegistroComponent,
    NzPopconfirmModule,
    NzModalModule
  ],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.css'
})
export class VentasComponent implements OnInit, OnDestroy {
  isLoading = true;
  ventas: Venta[] = [];
  clientes: Cliente[] = [];
  personal: Personal[] = [];
  searchTerm = '';
  showRegistro = false;
  editingVenta: Venta | null = null;
  isEditing = false;
  private readonly subscriptions = new Subscription();

  constructor(
    private apiService: ApiService,
    private realtimeSync: RealtimeSyncService
  ) {}

  ngOnInit() {
    this.cargarDatosIniciales();

    this.subscriptions.add(
      this.realtimeSync.watch('ventas').subscribe(() => {
        this.cargarVentas();
      })
    );

    this.subscriptions.add(
      timer(10000, 10000).subscribe(() => {
        this.cargarVentas();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  async cargarDatosIniciales() {
    this.isLoading = true;
    try {
      await Promise.all([
        this.cargarClientes(),
        this.cargarPersonal()
      ]);
      this.cargarVentas();
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    } finally {
      this.isLoading = false;
    }
  }

  cargarVentas() {
    this.apiService.get<VentaApiResponse[]>('ventas').subscribe({
      next: (dataFromApi) => {
        this.ventas = dataFromApi.map(item => ({
          id_venta: item.id_venta,
          clienteId: item.cliente_id,
          personalId: item.personal_id,
          fechaVenta: item.fecha_venta ? new Date(item.fecha_venta) : new Date(),
          total: item.total,
          notas: item.notas,
          productos: item.productos_vendidos || []
        }));
      },
      error: (error) => {
        console.error('Error al cargar ventas:', error);
      }
    });
  }

  async cargarClientes(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.get<Cliente[]>('/clientes/nombres').subscribe({
        next: (data) => {
          this.clientes = data;
          resolve();
        },
        error: (error) => reject(error),
      });
    });
  }

  async cargarPersonal(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.get<Personal[]>('personal/nombres').subscribe({
        next: (data) => {
          this.personal = data;
          resolve();
        },
        error: (error) => reject(error),
      });
    });
  }

  getNombreCliente(clienteId: string): string {
    const cliente = this.clientes.find((cli) => String(cli.id_cliente) === String(clienteId));
    return cliente ? cliente.nombre_cliente : 'Desconocido';
  }

  getNombrePersonal(personalId: string): string {
    const personal = this.personal.find((per) => String(per.id_personal) === String(personalId));
    return personal ? personal.nombre_personal : 'Desconocido';
  }

  openRegistro(venta?: Venta) {
    if (this.showRegistro) {
      return;
    }
    this.showRegistro = true;
    if (venta) {
      this.editingVenta = { ...venta };
      this.isEditing = true;
    } else {
      this.editingVenta = null;
      this.isEditing = false;
    }
  }

  closeRegistro() {
    this.showRegistro = false;
    this.editingVenta = null;
    this.isEditing = false;
    this.cargarDatosIniciales();
  }

  onModalVisibleChange(visible: boolean): void {
    if (!visible && this.showRegistro) {
      this.closeRegistro();
    }
  }

  onSubmitRegistro(ventaData: Venta) {
    const dataToSendToApi: VentaApiResponse = {
      id_venta: ventaData.id_venta,
      cliente_id: ventaData.clienteId,
      personal_id: ventaData.personalId,
      fecha_venta: ventaData.fechaVenta instanceof Date ? ventaData.fechaVenta.toISOString() : ventaData.fechaVenta,
      total: ventaData.total,
      notas: ventaData.notas,
      productos_vendidos: ventaData.productos
    };

    if (this.isEditing && this.editingVenta?.id_venta) {
      this.apiService.put<any>(`ventas/${this.editingVenta.id_venta}`, dataToSendToApi).subscribe({
        next: () => {
          this.apiService.actualizarABC().subscribe({
            next: () => {
              this.realtimeSync.notify('ventas', 'updated');
              this.realtimeSync.notify('productos', 'stock-updated');
              this.closeRegistro();
            },
            error: () => {
              this.realtimeSync.notify('ventas', 'updated');
              this.realtimeSync.notify('productos', 'stock-updated');
              this.closeRegistro();
            }
          });
        },
        error: (error) => console.error('Error al actualizar venta:', error)
      });
      return;
    }

    this.apiService.post<any>('ventas', dataToSendToApi).subscribe({
      next: () => {
        this.apiService.actualizarABC().subscribe({
          next: () => {
            this.realtimeSync.notify('ventas', 'created');
            this.realtimeSync.notify('productos', 'stock-updated');
            this.closeRegistro();
          },
          error: () => {
            this.realtimeSync.notify('ventas', 'created');
            this.realtimeSync.notify('productos', 'stock-updated');
            this.closeRegistro();
          }
        });
      },
      error: (error) => console.error('Error al registrar venta:', error)
    });
  }

  editarVenta(venta: Venta) {
    this.openRegistro(venta);
  }

  eliminarVenta(id_venta: string) {
    this.apiService.delete(`ventas/${id_venta}`).subscribe({
      next: () => {
        this.apiService.actualizarABC().subscribe({
          next: () => {
            this.cargarVentas();
            this.realtimeSync.notify('ventas', 'deleted');
            this.realtimeSync.notify('productos', 'stock-restored');
          },
          error: () => {
            this.cargarVentas();
            this.realtimeSync.notify('ventas', 'deleted');
            this.realtimeSync.notify('productos', 'stock-restored');
          }
        });
      },
      error: (error) => console.error('Error al eliminar venta:', error)
    });
  }

  exportarAExcel(): void {
    const dataToExport = this.ventas.map(venta => ({
      'ID Venta': venta.id_venta,
      'Cliente': this.getNombreCliente(venta.clienteId),
      'Personal': this.getNombrePersonal(venta.personalId),
      'Fecha Venta': venta.fechaVenta instanceof Date ? venta.fechaVenta.toLocaleString() : venta.fechaVenta,
      'Total': venta.total,
      'Notas': venta.notas
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.guardarArchivoExcel(excelBuffer, 'lista_ventas.xlsx');
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

  get filteredVentas(): Venta[] {
    if (!this.searchTerm) {
      return this.ventas;
    }
    const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
    return this.ventas.filter(venta =>
      venta.id_venta?.toLowerCase().includes(lowerCaseSearchTerm) ||
      this.getNombreCliente(venta.clienteId).toLowerCase().includes(lowerCaseSearchTerm) ||
      this.getNombrePersonal(venta.personalId).toLowerCase().includes(lowerCaseSearchTerm) ||
      (venta.notas && venta.notas.toLowerCase().includes(lowerCaseSearchTerm)) ||
      venta.total.toString().includes(lowerCaseSearchTerm)
    );
  }
}
