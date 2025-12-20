import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SolicitudCalculo, RespuestaCalculo } from '../interfaces/suelo.interface';
import { environment } from '../../environments/environment';

export interface CalcularYGuardarDto {
  chacraId: number;
  nombreMuestra?: string;
  datos: SolicitudCalculo;
}

export interface CalcularYGuardarResponse {
  calculoId: number;
  chacraNombre: string;
  resultado: RespuestaCalculo;
}

@Injectable({
  providedIn: 'root'
})
export class SueloService {
  private http = inject(HttpClient);

  // URL base desde variables de entorno
  private apiUrl = `${environment.apiUrl}/calculo-suelo`;
  private catalogoUrl = `${environment.apiUrl}/catalogo`;

  calcularNutrientes(datos: SolicitudCalculo): Observable<RespuestaCalculo> {
    return this.http.post<RespuestaCalculo>(`${this.apiUrl}/calcular-nutrientes`, datos);
  }

  calcularYGuardar(data: CalcularYGuardarDto): Observable<CalcularYGuardarResponse> {
    return this.http.post<CalcularYGuardarResponse>(`${this.apiUrl}/calcular-y-guardar`, data);
  }

  getTexturas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.catalogoUrl}/texturas`);
  }

  getZonas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.catalogoUrl}/zonas`);
  }

  // ============================================
  // MÉTODOS FILTRADOS CON INTELIGENCIA AGRONÓMICA
  // ============================================

  // Fertilizantes ricos en Nitrógeno (N > 9%)
  getFertilizantesNitrogeno(): Observable<any[]> {
    return this.http.get<any[]>(`${this.catalogoUrl}/fertilizantes/nitrogeno`);
  }

  // Fertilizantes ricos en Fósforo (P2O5 > 5%)
  getFertilizantesFosforo(): Observable<any[]> {
    return this.http.get<any[]>(`${this.catalogoUrl}/fertilizantes/fosforo`);
  }

  // Fertilizantes ricos en Potasio (K2O > 15%) - SIN GUANO
  getFertilizantesPotasio(): Observable<any[]> {
    return this.http.get<any[]>(`${this.catalogoUrl}/fertilizantes/potasio`);
  }

  // Enmiendas cálcicas (CaO > 20% o clasificación ENMIENDA)
  getEnmiendas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.catalogoUrl}/fertilizantes/enmienda`);
  }

  // Método original sin filtros (por compatibilidad)
  getFertilizantes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.catalogoUrl}/fertilizantes`);
  }
}
