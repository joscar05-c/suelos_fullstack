import { Injectable, inject } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { SolicitudCalculo, RespuestaCalculo } from '../interfaces/suelo.interface';
import { SoilCalculationEngine } from '../core/domain/engine/soil-calculation.engine';
import { SupabaseService } from '../core/services/supabase.service';
import { FirebaseAuthService } from './firebase-auth.service';

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
  private supabase = inject(SupabaseService);
  private firebaseAuth = inject(FirebaseAuthService);

  /**
   * ⚡ CÁLCULO AGRONÓMICO OFFLINE / INSTANTÁNEO
   * Ejecuta el cálculo usando el motor puro SoilCalculationEngine en el dispositivo
   * sin latencia ni dependencia de servidor o red.
   */
  calcularNutrientes(datos: SolicitudCalculo): Observable<RespuestaCalculo> {
    const resultado = SoilCalculationEngine.calcular(datos as any);
    return of(resultado as unknown as RespuestaCalculo);
  }

  /**
   * Guarda el cálculo realizado directamente en Supabase vinculado a la chacra
   */
  calcularYGuardar(
    chacraId: number,
    data: { nombreMuestra?: string; datos: SolicitudCalculo },
  ): Observable<CalcularYGuardarResponse> {
    const uid = this.firebaseAuth.currentUserUid;
    if (!uid) {
      throw new Error('Usuario no autenticado para guardar cálculo');
    }

    const resultado = SoilCalculationEngine.calcular(data.datos as any);
    const nombreMuestra =
      data.nombreMuestra ||
      `Análisis ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    return from(
      this.supabase.client
        .from('calculos_suelo')
        .insert({
          chacra_id: chacraId,
          usuario_id: uid,
          nombre_muestra: nombreMuestra,
          datos_entrada: data.datos,
          resultados: resultado,
        })
        .select('id')
        .single()
    ).pipe(
      map(({ data: row, error }) => {
        if (error) {
          console.error('Error al guardar cálculo en Supabase:', error);
          throw error;
        }
        return {
          calculoId: Number(row.id),
          chacraNombre: '',
          resultado: resultado as unknown as RespuestaCalculo,
        };
      })
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
