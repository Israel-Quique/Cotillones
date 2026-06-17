import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
// Si RegistroComponent es para clientes, necesitarás un componente específico para el registro de pedidos.
// Por ahora, lo dejaré comentado como en tu código original, pero ten esto en cuenta.
// import { RegistroComponent } from './registro/registro.component';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ApiService } from '../api.service';
import { FormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms'; // FormBuilder y Validators no se están usando en este componente actualmente
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';

export interface Pedidos {
  id_pedido: string; // Cambiado a id_pedido para que coincida con la tabla SQL
  cliente_id: string; // TEXT en SQL, por lo tanto string
  personal_id: string; // TEXT en SQL, por lo tanto string
  numero_pedido: string | null; // VARCHAR UNIQUE en SQL, puede ser nulo en la interfaz si es opcional
  fecha_pedido: string; // DATETIME en SQL
  fecha_evento: string; // DATE en SQL
  descripcion_pedido: string | null; // TEXT en SQL, puede ser nulo
  productos_pedido: string | null; // TEXT en SQL, puede ser nulo (si es JSON, lo manejas como string aquí)
  precio_total: number; // DECIMAL en SQL
  acuenta: number | null; // DECIMAL en SQL, puede ser nulo
  saldo: number | null; // DECIMAL en SQL, puede ser nulo
  terminos_condiciones: string | null; // TEXT en SQL, puede ser nulo
  fecha_creacion: string; // DATETIME en SQL
  fecha_actualizacion: string; // DATETIME en SQL
  estado_pedido_id: number; // INTEGER en SQL
}

@Component({
  selector: 'app-pedidos',
  standalone: true, // Añadido 'standalone: true' si este es un componente standalone
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
    NzFormModule,
    // Si usas RegistroComponent para pedidos, descomenta y asegúrate que acepte `Pedidos`
    // RegistroComponent,
  ],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.css',
})
export class PedidosComponent {
  pedidos: Pedidos[] = [];
  showLista = true;
  showRegistro = false;
  EditarPedidos: Pedidos | null = null; // Cambiado a Pedidos
  isEditing = false;
  searchTerm: string = '';
  // Si vas a usar FormBuilder y Validators para el formulario de registro de pedidos,
  // entonces FormBuilder y Validators deben importarse y usarse aquí o en el componente de registro.
  // constructor(private apiService: ApiService, private fb: FormBuilder) { }
  constructor(private apiService: ApiService) { }


  ngOnInit() {
    this.cargarPedidos(); // Cambiado de cargarProducto a cargarPedidos
  }

  cargarPedidos() { // Cambiado de cargarProducto a cargarPedidos
    this.apiService.get<Pedidos[]>('Pedidos').subscribe((data: Pedidos[]) => {
      this.pedidos = data;
    });
  }

  openRegistro(pedido?: Pedidos) { // Cambiado a 'pedido' en singular
    this.showRegistro = true;
    this.showLista = false;
    if (pedido) {
      this.EditarPedidos = { ...pedido };
      this.isEditing = true;
    } else {
      this.EditarPedidos = null;
      this.isEditing = false;
    }
  }

  eliminarPedido(id: string) { // Cambiado de eliminarUsuario a eliminarPedido y el ID es string
    console.log(`Eliminar pedido ${id}`);
    // Implementa la lógica de eliminación con tu apiService
    // this.apiService.delete<any>(`Pedidos/${id}`).subscribe(() => {
    //   this.cargarPedidos(); // Recarga la lista después de eliminar
    // });
  }

  // Si el formulario de registro está en un componente separado (RegistroComponent)
  // entonces `formValue` debería ser del tipo de datos que emite ese componente,
  // probablemente un objeto `Pedidos`.
  onSubmitRegistro(formValue: Pedidos) { // Asumiendo que `formValue` es de tipo `Pedidos`
    // Aquí puedes añadir validación si el formulario se maneja directamente en este componente.
    // Si el formulario es de un componente hijo, este ya debería haber validado.
    if (this.isEditing && this.EditarPedidos) {
      this.apiService.put<Pedidos>(`Pedidos/${this.EditarPedidos.id_pedido}`, formValue).subscribe(() => {
        this.cargarPedidos();
        this.closeRegistro();
      });
    } else {
      this.apiService.post<Pedidos>('Pedidos', formValue).subscribe(() => {
        this.cargarPedidos();
        this.closeRegistro();
      });
    }
  }

  closeRegistro() {
    this.showRegistro = false;
    this.showLista = true;
  }
}