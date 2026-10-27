import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SolicitudCalculo, RespuestaCalculo } from '../interfaces/suelo.interface';
import { SoilCalculationEngine } from '../core/domain/engine/soil-calculation.engine';
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
  providedIn: 'root',
})
export class SueloService {
  private http = inject(HttpClient);

  // URL base mantenida temporalmente mientras se completa la migración a Supabase
  private apiUrl = `${environment.apiUrl}/calculo-suelo`;

  /**
   * ⚡ CÁLCULO AGRONÓMICO OFFLINE / INSTANTÁNEO
   * Ejecuta el cálculo usando el motor puro SoilCalculationEngine en el dispositivo
   * sin latencia ni dependencia de servidor o red.
   */
  calcularNutrientes(datos: SolicitudCalculo): Observable<RespuestaCalculo> {
    try {
      const resultado = SoilCalculationEngine.calcular(datos as any);
      return of(resultado as unknown as RespuestaCalculo);
    } catch (error) {
      console.warn('Fallo en motor local, intentando fallback de red si estuviera disponible:', error);
      return this.http.post<RespuestaCalculo>(`${this.apiUrl}/calcular-nutrientes`, datos);
    }
  }

  /**
   * Método de guardado en Chacra
   * (En el Paso 2/3 se conectará al repositorio local Offline-First y a Supabase)
   */
  calcularYGuardar(
    chacraId: number,
    data: { nombreMuestra?: string; datos: SolicitudCalculo },
  ): Observable<CalcularYGuardarResponse> {
    return this.http.post<CalcularYGuardarResponse>(
      `${environment.apiUrl}/chacras/${chacraId}/calculos`,
      data,
    );
  }

  // ============================================
  // CATÁLOGOS LOCALES OFFLINE (0ms de latencia)
  // ============================================

  getTexturas(): Observable<any[]> {
    return of(SoilCalculationEngine.getTexturas());
  }

  getZonas(): Observable<any[]> {
    return of(SoilCalculationEngine.getZonas());
  }

  getFertilizantesNitrogeno(): Observable<any[]> {
    return of(SoilCalculationEngine.getFertilizantesNitrogeno());
  }

  getFertilizantesFosforo(): Observable<any[]> {
    return of(SoilCalculationEngine.getFertilizantesFosforo());
  }

  getFertilizantesPotasio(): Observable<any[]> {
    return of(SoilCalculationEngine.getFertilizantesPotasio());
  }

  getEnmiendas(): Observable<any[]> {
    return of(SoilCalculationEngine.getEnmiendas());
  }

  getFertilizantes(): Observable<any[]> {
    return of(SoilCalculationEngine.getTodosFertilizantes());
  }
}
