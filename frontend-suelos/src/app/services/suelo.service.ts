import { Injectable, inject } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SolicitudCalculo, RespuestaCalculo } from '../interfaces/suelo.interface';
import { SoilCalculationEngine } from '../core/domain/engine/soil-calculation.engine';
import { SupabaseService } from '../core/services/supabase.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { OfflineStorageService } from '../core/services/offline-storage.service';

export interface CalcularYGuardarDto {
  chacraId: number;
  nombreMuestra?: string;
  datos: SolicitudCalculo;
}

export interface CalcularYGuardarResponse {
  calculoId: number;
  chacraNombre: string;
  resultado: RespuestaCalculo;
  syncStatus?: 'SYNCED' | 'PENDING';
}

@Injectable({
  providedIn: 'root',
})
export class SueloService {
  private supabase = inject(SupabaseService);
  private firebaseAuth = inject(FirebaseAuthService);
  private offlineStorage = inject(OfflineStorageService);

  private get isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

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
   * Guarda el cálculo realizado:
   * - En modo Offline: se guarda en LocalStorage con ID temporal y syncStatus: 'PENDING'
   * - En modo Online: se guarda en Supabase y se cachea localmente como 'SYNCED'
   * - Si falla la red: fallback automático a LocalStorage como 'PENDING'
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

    // Si estamos desconectados o la chacra es local (id < 0)
    if (!this.isOnline || chacraId < 0) {
      const pendingCalc = this.offlineStorage.addPendingCalculo(
        chacraId,
        uid,
        nombreMuestra,
        data.datos,
        resultado
      );
      return of({
        calculoId: pendingCalc.id,
        chacraNombre: '',
        resultado: resultado as unknown as RespuestaCalculo,
        syncStatus: 'PENDING' as const,
      });
    }

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
        if (error) throw error;

        // Cachear localmente como sincronizado
        const calculosLocales = this.offlineStorage.getLocalCalculos(chacraId);
        calculosLocales.unshift({
          id: Number(row.id),
          chacraId,
          usuarioId: uid,
          nombreMuestra,
          datosEntrada: data.datos,
          resultados: resultado,
          fecha: new Date().toISOString(),
          syncStatus: 'SYNCED' as const,
        });
        this.offlineStorage.saveLocalCalculos(chacraId, calculosLocales);

        return {
          calculoId: Number(row.id),
          chacraNombre: '',
          resultado: resultado as unknown as RespuestaCalculo,
          syncStatus: 'SYNCED' as const,
        };
      }),
      catchError((err) => {
        console.warn('[SueloService] Fallo al insertar cálculo en Supabase, guardando localmente:', err);
        const pendingCalc = this.offlineStorage.addPendingCalculo(
          chacraId,
          uid,
          nombreMuestra,
          data.datos,
          resultado
        );
        return of({
          calculoId: pendingCalc.id,
          chacraNombre: '',
          resultado: resultado as unknown as RespuestaCalculo,
          syncStatus: 'PENDING' as const,
        });
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
