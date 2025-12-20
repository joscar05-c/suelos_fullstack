import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Chacra {
  id: number;
  nombre: string;
  areaHa: string;
  ubicacion?: string;
  descripcion?: string;
  totalCalculos?: number;
  ultimoCalculo?: string;
  usuarioId?: number;
}

export interface CreateChacraDto {
  nombre: string;
  areaHa: number;
  ubicacion?: string;
  descripcion?: string;
}

export interface UpdateChacraDto {
  nombre?: string;
  areaHa?: number;
  ubicacion?: string;
  descripcion?: string;
}

export interface CalculoResumen {
  id: number;
  fecha: string;
  nombreMuestra: string;
  metaRendimiento?: number;
  ph?: number;
  alertasCount?: number;
}

export interface CalculoDetalle {
  id: number;
  fecha: string;
  nombreMuestra: string;
  datosEntrada: any;
  resultados: any;
}

@Injectable({
  providedIn: 'root'
})
export class ChacrasService {
  private apiUrl = `${environment.apiUrl}/chacras`;

  constructor(private http: HttpClient) {}

  getChacras(): Observable<Chacra[]> {
    return this.http.get<Chacra[]>(this.apiUrl);
  }

  getChacra(id: number): Observable<Chacra> {
    return this.http.get<Chacra>(`${this.apiUrl}/${id}`);
  }

  createChacra(data: CreateChacraDto): Observable<Chacra> {
    return this.http.post<Chacra>(this.apiUrl, data);
  }

  updateChacra(id: number, data: UpdateChacraDto): Observable<Chacra> {
    return this.http.put<Chacra>(`${this.apiUrl}/${id}`, data);
  }

  deleteChacra(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  getCalculos(chacraId: number): Observable<CalculoResumen[]> {
    return this.http.get<CalculoResumen[]>(`${this.apiUrl}/${chacraId}/calculos`);
  }

  getCalculo(chacraId: number, calculoId: number): Observable<CalculoDetalle> {
    return this.http.get<CalculoDetalle>(`${this.apiUrl}/${chacraId}/calculos/${calculoId}`);
  }
}
