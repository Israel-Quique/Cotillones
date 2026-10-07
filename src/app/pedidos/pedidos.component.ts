import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTableModule } from 'ng-zorro-antd/table';
import { Subscription, timer } from 'rxjs';
import { ApiService } from '../api.service';
import { RealtimeSyncService } from '../realtime-sync.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { PedidoOption, Pedidos, RegistroComponent } from './registro/registro.component';

interface ClienteApi {
  id_cliente?: string;
  nombre?: string;
  apellido?: string;
}

interface PersonalApi {
  id_personal?: string;
  nombre_personal?: string;
}

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    FormsModule,
    SidebarComponent,
    TopbarComponent,
    NzGridModule,
    NzInputModule,
    NzModalModule,
    NzPopconfirmModule,
    RegistroComponent
  ],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.css'
})
export class PedidosComponent implements OnInit, OnDestroy {
  pedidos: Pedidos[] = [];
  clientes: PedidoOption[] = [];
  personal: PedidoOption[] = [];
  showLista = true;
  showRegistro = false;
  editarPedido: Pedidos | null = null;
  isEditing = false;
  searchTerm = '';
  private readonly subscriptions = new Subscription();

  constructor(
    private apiService: ApiService,
    private realtimeSync: RealtimeSyncService
  ) {}

  ngOnInit(): void {
    this.cargarAuxiliares();
    this.cargarPedidos();

    this.subscriptions.add(
      this.realtimeSync.watch('pedidos').subscribe(() => {
        this.cargarPedidos();
      })
    );

    this.subscriptions.add(
      timer(10000, 10000).subscribe(() => {
        this.cargarPedidos();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  cargarAuxiliares(): void {
    this.apiService.get<ClienteApi[]>('clientes/nombres').subscribe({
      next: (data) => {
        this.clientes = data.map((cliente) => ({
          id: String(cliente.id_cliente || ''),
          label: `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || String(cliente.id_cliente || '')
        }));
      },
      error: (error) => console.error('Error al cargar clientes para pedidos:', error)
    });

    this.apiService.get<PersonalApi[]>('personal/nombres').subscribe({
      next: (data) => {
        this.personal = data.map((persona) => ({
          id: String(persona.id_personal || ''),
          label: persona.nombre_personal || String(persona.id_personal || '')
        }));
      },
      error: (error) => console.error('Error al cargar personal para pedidos:', error)
    });
  }

  cargarPedidos(): void {
    this.apiService.get<Pedidos[]>('pedidos').subscribe({
      next: (data) => {
        this.pedidos = data;
      },
      error: (error) => console.error('Error al cargar pedidos:', error)
    });
  }

  openRegistro(pedido?: Pedidos): void {
    this.showRegistro = true;
    this.showLista = false;
    if (pedido) {
      this.editarPedido = { ...pedido };
      this.isEditing = true;
      return;
    }

    this.editarPedido = null;
    this.isEditing = false;
  }

  eliminarPedido(id: string): void {
    this.apiService.delete(`pedidos/${id}`).subscribe({
      next: () => {
        this.cargarPedidos();
        this.realtimeSync.notify('pedidos', 'deleted');
      },
      error: (error) => console.error('Error al eliminar pedido:', error)
    });
  }

  onSubmitRegistro(formValue: Pedidos): void {
    if (this.isEditing && this.editarPedido?.id_pedido) {
      this.apiService.put<Pedidos>(`pedidos/${this.editarPedido.id_pedido}`, formValue).subscribe({
        next: () => {
          this.cargarPedidos();
          this.realtimeSync.notify('pedidos', 'updated');
          this.closeRegistro();
        },
        error: (error) => console.error('Error al actualizar pedido:', error)
      });
      return;
    }

    this.apiService.post<Pedidos>('pedidos', formValue).subscribe({
      next: () => {
        this.cargarPedidos();
        this.realtimeSync.notify('pedidos', 'created');
        this.closeRegistro();
      },
      error: (error) => console.error('Error al registrar pedido:', error)
    });
  }

  closeRegistro(): void {
    this.showRegistro = false;
    this.showLista = true;
    this.editarPedido = null;
    this.isEditing = false;
  }

  getEstadoPedido(estadoId: number): string {
    switch (estadoId) {
      case 1:
        return 'Activo';
      case 2:
        return 'Pendiente';
      case 3:
        return 'Entregado';
      case 4:
        return 'Cancelado';
      default:
        return 'Sin estado';
    }
  }

  getNombreCliente(id: string): string {
    return this.clientes.find((cliente) => cliente.id === String(id))?.label || id;
  }

  getNombrePersonal(id: string): string {
    return this.personal.find((persona) => persona.id === String(id))?.label || id;
  }

  get filteredPedidos(): Pedidos[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.pedidos;
    }

    return this.pedidos.filter((pedido) =>
      [
        pedido.id_pedido || '',
        pedido.numero_pedido || '',
        this.getNombreCliente(pedido.cliente_id),
        this.getNombrePersonal(pedido.personal_id),
        pedido.descripcion_pedido || '',
        pedido.direccion_entrega || '',
        this.getEstadoPedido(pedido.estado_pedido_id)
      ].some((value) => value.toLowerCase().includes(term))
    );
  }
}
