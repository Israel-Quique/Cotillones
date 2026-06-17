import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ApiService } from '../api.service';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { RegistroComponent } from './registro/registro.component';
import * as XLSX from 'xlsx';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzMessageService } from 'ng-zorro-antd/message';
import { saveAs } from 'file-saver';
import { Subscription, timer } from 'rxjs';
import { RealtimeSyncService } from '../realtime-sync.service';

export interface Productos {
  id_producto: string;
  nombre: string;
  descripcion: string | null;
  precio_unidad: number;
  precio_cantidad: number;
  url_imagen: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  cantidad_stock: number;
  categoria_id: string;
  temporada_id: string | null;
  estado_producto_id: number;
  ubicacion_id: number;
  categoria_abc: string;
  categoria_abc_cantidad?: string | null;
  categoria_abc_valor?: string | null;
  puntos_abc_cantidad?: number | null;
  puntos_abc_valor?: number | null;
  cantidad_total_vendida?: number | null;
  valor_total_vendido?: number | null;
  costo_de_producto: number;
  demanda_anual?: number | null;
  costo_ordenar?: number | null;
  costo_mantenimiento?: number | null;
  eoq?: number | null;
  punto_reorden?: number | null;
  tiempo_entrega_dias?: number | null;
  stock_seguridad?: number | null;
  qr_producto: string;
}

export interface Categoria {
  id_categoria: string;
  nombre: string;
}

export interface Temporada {
  id_temporada: string;
  nombre: string;
}

export interface EstadoProducto {
  id_estado_producto: number;
  nombre: string;
}

// Interfaz Ubicacion modificada para usar 'descripcion'
export interface Ubicacion {
  id_ubicacion: number;
  descripcion: string; // ¡Cambiado de 'nombre' a 'descripcion'!
}



@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent,
    TopbarComponent,
    NzGridModule,
    NzInputModule,
    NzFormModule,
    RegistroComponent,
    NzSelectModule,
    NzModalModule,
    NzMessageModule,
  ],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css',
})
export class ProductosComponent implements OnInit, OnDestroy {
  
  productos: Productos[] = [];
  categorias: Categoria[] = [];
  temporadas: Temporada[] = [];
  estadosProducto: EstadoProducto[] = [];
  ubicaciones: Ubicacion[] = []; // Array para almacenar las ubicaciones
  searchTerm = '';
  showRegistro = false;
  showLista = true;
  EditarProductos: Productos | null = null;
  isEditing = false;
  private imageUrlBase = 'http://localhost:3000';
  private readonly subscriptions = new Subscription();

  constructor(
    private apiService: ApiService,
    private realtimeSync: RealtimeSyncService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    // === ÚNICA EJECUCIÓN DEL ANÁLISIS ABC AL INICIO ===
    /*this.apiService.actualizarABC().subscribe({
      next: (response) => {
        console.log('Análisis ABC ejecutado una vez:', response.message);
        // Una vez que el ABC se ha ejecutado, carga los productos
        this.cargarProducto();
      },
      error: (error) => {
        console.error('Error al ejecutar el análisis ABC inicial:', error);
        // Si el ABC falla, aún así, carga los productos, aunque con categorías potencialmente desactualizadas.
        this.cargarProducto();
      },
    });*/
    this.cargarProducto();
    this.cargarCategorias();
    this.cargarTemporadas();
    this.cargarEstadosProducto();
    this.cargarUbicaciones();

    this.subscriptions.add(
      this.realtimeSync.watch('productos', 'ventas').subscribe(() => {
        this.cargarProducto();
      })
    );

    this.subscriptions.add(
      timer(10000, 10000).subscribe(() => {
        this.cargarProducto();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getFullImageUrl(relativePath: string | null): string {
    if (!relativePath) {
      return '';
    }
    const cleanRelativePath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;
    return `${this.imageUrlBase}/${cleanRelativePath}`;
  }

  cargarProducto() {
    this.apiService.get<any>('productos').subscribe({
      next: (response) => {
        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.productos)
              ? response.productos
              : [];

        console.log('Datos de productos recibidos:', response);
        this.productos = data as Productos[];
  
        // --- INICIO DE LA INTEGRACIÓN DEL ANÁLISIS ABC ---
        // Llamamos al método actualizarABC del servicio para ejecutar el análisis en el backend.
        /*this.apiService.actualizarABC().subscribe({
          next: (response)n => {
            console.log('Análisis ABC ejecutado:', response.message);
            // Si la categorización ABC actualiza el campo categoria_abc en la base de datos
            // y quieres que esos cambios se reflejen inmediatamente en la UI,
            // es necesario volver a cargar los productos para obtener los datos más recientes.
            this.cargarProducto();
          },
          error: (abcError) => {
            console.error('Error al ejecutar el análisis ABC:', abcError);
            // Aquí puedes añadir lógica para mostrar un mensaje de error al usuario,
            // por ejemplo, usando un servicio de notificaciones de NG-ZORRO.
          }
        });*/
        // --- FIN DE LA INTEGRACIÓN DEL ANÁLISIS ABC ---
  
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.productos = [];
        this.message.error('No se pudieron cargar los productos.');
      },
    });
  }

  cargarCategorias() {
    this.apiService.get<Categoria[]>('categorias').subscribe({
      next: (data) => {
        this.categorias = data;
        console.log('Categorías cargadas:', data);
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
      },
    });
  }

  cargarTemporadas() {
    this.apiService.get<Temporada[]>('temporadas').subscribe({
      next: (data) => {
        this.temporadas = data;
        console.log('Temporadas cargadas:', data);
      },
      error: (error) => {
        console.error('Error al cargar temporadas:', error);
      },
    });
  }

  cargarEstadosProducto() {
    this.apiService.get<EstadoProducto[]>('estados-producto').subscribe({
      next: (data) => {
        this.estadosProducto = data;
        console.log('Estados de producto cargados:', data);
      },
      error: (error) => {
        console.error('Error al cargar estados de producto:', error);
      },
    });
  }

  cargarUbicaciones() {
    this.apiService.get<Ubicacion[]>('ubicaciones').subscribe({
      next: (data) => {
        this.ubicaciones = data;
        console.log('Ubicaciones cargadas:', data);
      },
      error: (error) => {
        console.error('Error al cargar ubicaciones:', error);
      },
    });
  }

  getNombreCategoria(categoriaId: string): string {
    const categoria = this.categorias.find(
      (cat) => cat.id_categoria === categoriaId
    );
    return categoria ? categoria.nombre : 'Desconocida';
  }

  getNombreTemporada(temporadaId: string | null): string {
    if (!temporadaId) return 'N/A';
    const temporada = this.temporadas.find(
      (temp) => temp.id_temporada === temporadaId
    );
    return temporada ? temporada.nombre : 'Desconocida';
  }

  getNombreEstadoProducto(estadoId: number): string {
    const estado = this.estadosProducto.find(
      (est) => est.id_estado_producto === estadoId
    );
    return estado ? estado.nombre : 'Desconocido';
  }

  // Función para obtener la descripción de la ubicación
  getDescripcionUbicacion(ubicacionId: number): string {
    const ubicacion = this.ubicaciones.find(
      (ub) => ub.id_ubicacion === ubicacionId
    );
    return ubicacion ? ubicacion.descripcion : 'Desconocida'; // ¡Cambiado a .descripcion!
  }

  openRegistro(producto?: Productos) {
    if (this.showRegistro) {
      return;
    }
    this.showRegistro = true;
    this.showLista = false;
    if (producto) {
      this.EditarProductos = { ...producto };
      this.isEditing = true;
    } else {
      this.EditarProductos = null;
      this.isEditing = false;
    }
  }

  closeRegistro() {
    this.showRegistro = false;
    this.showLista = true;
    this.EditarProductos = null;
    this.isEditing = false;
    this.cargarProducto();
  }

  onModalVisibleChange(visible: boolean): void {
    if (!visible && this.showRegistro) {
      this.closeRegistro();
    }
  }

  onSubmitRegistro(formValue: any) {
    this.realtimeSync.notify('productos', this.isEditing ? 'updated' : 'created');
    this.closeRegistro();
  }

  eliminarProducto(id: string) {
    this.apiService.delete(`productos/${id}`).subscribe({
      next: () => {
        this.cargarProducto();
        this.realtimeSync.notify('productos', 'deleted');
      },
      error: (error) => {
        console.error('Error al eliminar producto:', error);
      },
    });
  }

  activarProducto(id: string) {
    this.apiService.put(`productos/${id}/estado`, { estado_producto_id: 1 }).subscribe({
      next: () => {
        this.cargarProducto();
        this.realtimeSync.notify('productos', 'activated');
      },
      error: (error) => console.error('Error al activar producto:', error),
    });
  }

  recalcularInventario() {
    this.apiService.actualizarABC().subscribe({
      next: () => {
        this.cargarProducto();
        this.realtimeSync.notify('productos', 'inventory-models-updated');
      },
      error: (error) => {
        console.error('Error al recalcular ABC y EOQ:', error);
      }
    });
  }

  desactivarProducto(id: string) {
    this.apiService.put(`productos/${id}/estado`, { estado_producto_id: 2 }).subscribe({
      next: () => {
        this.cargarProducto();
        this.realtimeSync.notify('productos', 'deactivated');
      },
      error: (error) => console.error('Error al desactivar producto:', error),
    });
  }

  exportarAExcel(): void {
    this.apiService.exportarProductos().subscribe((data) => {
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
      const workbook: XLSX.WorkBook = {
        Sheets: { data: worksheet },
        SheetNames: ['data'],
      };
      const excelBuffer: any = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });
      this.guardarArchivoExcel(excelBuffer, 'lista_Productos.xlsx');
    });
  }

  guardarArchivoExcel(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
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
  exportarQR(qrDataUrl: string, ubicacionId: string): void {
      if (qrDataUrl) {
        // Extraer el tipo de archivo y los datos Base64 de la URL
        const parts = qrDataUrl.split(',');
        const mimeType = parts[0].split(':')[1].split(';')[0];
        const base64Data = parts[1];
  
        // Convertir los datos Base64 a un Blob
        const byteString = atob(base64Data);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType });
  
        // Crear un nombre de archivo para la descarga
        const filename = `qr_ubicacion_${ubicacionId || 'sin_id'}.png`; // Puedes ajustar el nombre y la extensión
  
        // Utilizar file-saver para iniciar la descarga
        saveAs(blob, filename);
      } else {
        console.warn('No se encontró información del código QR para exportar.');
        // Opcionalmente, mostrar un mensaje al usuario
      }
    }

  get filteredProductos(): Productos[] {
      const term = this.searchTerm.trim().toLowerCase();

      if (!term) {
        return this.productos;
      }

      return this.productos.filter((producto) =>
        [
          producto.nombre,
          producto.descripcion || '',
          this.getNombreCategoria(producto.categoria_id),
          this.getNombreTemporada(producto.temporada_id),
          this.getDescripcionUbicacion(producto.ubicacion_id),
          producto.categoria_abc || '',
          producto.categoria_abc_cantidad || '',
          producto.categoria_abc_valor || '',
        ].some((value) => value.toLowerCase().includes(term))
      );
    }
}
