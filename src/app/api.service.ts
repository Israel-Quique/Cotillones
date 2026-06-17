import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Helper para normalizar la URL
  private getFullUrl(endpoint: string): string {
    // Elimina la barra inicial del endpoint si existe, para evitar doble barra
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(this.getFullUrl(endpoint));
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(this.getFullUrl(endpoint), data);
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(this.getFullUrl(endpoint), data);
  }

  patch<T>(endpoint: string, data: any): Observable<T> {
    return this.http.patch<T>(this.getFullUrl(endpoint), data);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(this.getFullUrl(endpoint));
  }

  head<T>(endpoint: string): Observable<T> {
    return this.http.head<T>(this.getFullUrl(endpoint));
  }

  options<T>(endpoint: string): Observable<T> {
    return this.http.options<T>(this.getFullUrl(endpoint));
  }

  // Nuevo método para cargar archivos (FormData)
  uploadFile<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.post<T>(this.getFullUrl(endpoint), formData);
  }

  // Tus métodos de exportación también se beneficiarán de esto
  exportarClientes(): Observable<any[]> { // Usar 'any[]' o definir una interfaz para los clientes
    return this.http.get<any[]>(this.getFullUrl('exportar-clientes'));
  }
  exportarResena(): Observable<any[]> { // Usar 'any[]' o definir una interfaz para las reseñas
    return this.http.get<any[]>(this.getFullUrl('exportar-resenas'));
  }
  exportarPersonal(): Observable<any[]> { // Usar 'any[]' o definir una interfaz para el personal
    return this.http.get<any[]>(this.getFullUrl('exportar-personal-entrega'));
  }
  exportarProductos(): Observable<any[]> { // Usar 'any[]' o definir una interfaz para los productos
    return this.http.get<any[]>(this.getFullUrl('exportar-productos'));
  }

  actualizarABC(): Observable<any> {
    return this.http.put(`${this.baseUrl}/abc-con-valor-monetario`, {});
  }
}
