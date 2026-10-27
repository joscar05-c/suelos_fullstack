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

  constructor() {
    // Inicializar motor con catálogos cacheados en localStorage si existen
    const cached = this.offlineStorage.getCachedCatalogos();
    if (cached) {
      SoilCalculationEngine.setCatalogosDinamicos(cached);
    }
  }

  // ============================================
  // CATÁLOGOS LOCALES OFFLINE (0ms de latencia)
  // ============================================

  /**
   * Sincroniza dinámicamente los catálogos (fertilizantes, requerimientos de cultivos, etc.)
   * desde Supabase hacia el almacenamiento local del dispositivo.
   */
  syncCatalogosFromSupabase(): Observable<boolean> {
    if (!this.isOnline) {
      const cached = this.offlineStorage.getCachedCatalogos();
      if (cached) {
        SoilCalculationEngine.setCatalogosDinamicos(cached);
      }
      return of(false);
    }

    return from(
      Promise.all([
        this.supabase.client.from('fuentes_fertilizantes').select('*').order('id', { ascending: true }),
        this.supabase.client.from('requerimientos_cultivo').select('*').order('id', { ascending: true }),
        this.supabase.client.from('texturas_suelo').select('*').order('id', { ascending: true }),
        this.supabase.client.from('tasas_mineralizacion').select('*').order('id', { ascending: true }),
      ])
    ).pipe(
      map(([resFuentes, resReqs, resTexturas, resZonas]) => {
        const fuentes = (resFuentes.data || []).map((row: any) => ({
          id: Number(row.id),
          nombre: row.nombre,
          clasificacion: row.clasificacion,
          porc_n: Number(row.porc_n || 0),
          porc_p2o5: Number(row.porc_p2o5 || 0),
          porc_k2o: Number(row.porc_k2o || 0),
          porc_cao: Number(row.porc_cao || 0),
          porc_mgo: Number(row.porc_mgo || 0),
          porc_s: Number(row.porc_s || 0),
          porc_b: Number(row.porc_b || 0),
          porc_cu: Number(row.porc_cu || 0),
          porc_zn: Number(row.porc_zn || 0),
          porc_mn: Number(row.porc_mn || 0),
          porc_fe: Number(row.porc_fe || 0),
        }));

        const requerimientos = (resReqs.data || []).map((row: any) => ({
          id: Number(row.id),
          cultivo: row.cultivo,
          metaQuintales: Number(row.meta_quintales),
          n: Number(row.n || 0),
          p2o5: Number(row.p2o5 || 0),
          k2o: Number(row.k2o || 0),
          cao: Number(row.cao || 0),
          mgo: Number(row.mgo || 0),
          s: Number(row.s || 0),
          b: Number(row.b || 0),
          cu: Number(row.cu || 0),
          zn: Number(row.zn || 0),
          mn: Number(row.mn || 0),
          fe: Number(row.fe || 0),
        }));

        const texturas = (resTexturas.data || []).map((row: any) => ({
          id: Number(row.id),
          nombre: row.nombre,
          densidadAparente: Number(row.densidad_aparente || 1.35),
        }));

        const zonas = (resZonas.data || []).map((row: any) => ({
          id: Number(row.id),
          zona: row.zona,
          porcentaje: Number(row.tasa || 3.0),
        }));

        const catalogoPayload = {
          fuentes: fuentes.length > 0 ? fuentes : undefined,
          requerimientos: requerimientos.length > 0 ? requerimientos : undefined,
          texturas: texturas.length > 0 ? texturas : undefined,
          zonas: zonas.length > 0 ? zonas : undefined,
        };

        this.offlineStorage.saveCachedCatalogos(catalogoPayload);
        SoilCalculationEngine.setCatalogosDinamicos(catalogoPayload);
        console.log('✅ Catálogos agronómicos sincronizados dinámicamente desde Supabase');
        return true;
      }),
      catchError((err) => {
        console.warn('⚠️ No se pudieron refrescar catálogos de Supabase, usando caché:', err);
        const cached = this.offlineStorage.getCachedCatalogos();
        if (cached) {
          SoilCalculationEngine.setCatalogosDinamicos(cached);
        }
        return of(false);
      })
    );
  }

  getCultivos(): Observable<any[]> {
    return of(SoilCalculationEngine.getCultivos());
  }

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
