import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from '../core/services/supabase.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { OfflineStorageService, LocalChacra } from '../core/services/offline-storage.service';

export interface Chacra {
  id: number;
  nombre: string;
  areaHa: string;
  ubicacion?: string;
  descripcion?: string;
  totalCalculos?: number;
  ultimoCalculo?: string;
  usuarioId?: string | number;
  calculos?: any[];
  syncStatus?: 'SYNCED' | 'PENDING';
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
  syncStatus?: 'SYNCED' | 'PENDING';
}

export interface CalculoDetalle {
  id: number;
  fecha: string;
  nombreMuestra: string;
  datosEntrada: any;
  resultados: any;
  syncStatus?: 'SYNCED' | 'PENDING';
}

@Injectable({
  providedIn: 'root',
})
export class ChacrasService {
  private supabase = inject(SupabaseService);
  private firebaseAuth = inject(FirebaseAuthService);
  private offlineStorage = inject(OfflineStorageService);

  private get isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Obtiene todas las parcelas/chacras del usuario autenticado.
   * Estrategia Offline-First:
   * - Si está sin internet, devuelve los registros de LocalStorage.
   * - Si está online, consulta Supabase, fusiona con registros pendientes locales y actualiza el caché.
   */
  getChacras(): Observable<Chacra[]> {
    const uid = this.firebaseAuth.currentUserUid;
    if (!uid) {
      return of([]);
    }

    if (!this.isOnline) {
      const local = this.offlineStorage.getLocalChacras(uid);
      return of(local);
    }

    return from(
      this.supabase.client
        .from('v_chacras_resumen')
        .select('*')
        .eq('usuario_id', uid)
        .order('createdAt', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;

        const serverChacras: LocalChacra[] = (data || []).map((row: any) => ({
          id: Number(row.id),
          nombre: row.nombre,
          areaHa: String(row.areaHa),
          ubicacion: row.ubicacion || undefined,
          descripcion: row.descripcion || undefined,
          totalCalculos: row.totalCalculos || 0,
          ultimoCalculo: row.ultimoCalculo || undefined,
          usuarioId: row.usuario_id,
          syncStatus: 'SYNCED',
        }));

        // Fusionar con chacras pendientes que aún no se sincronizan
        const pendingChacras = this.offlineStorage.getPendingChacras(uid);
        const combined = [...pendingChacras, ...serverChacras];

        // Actualizar caché local
        this.offlineStorage.saveLocalChacras(uid, combined);

        return combined;
      }),
      catchError((err) => {
        console.warn('[ChacrasService] Fallo de red con Supabase, usando caché local:', err);
        return of(this.offlineStorage.getLocalChacras(uid));
      })
    );
  }

  /**
   * Obtiene los detalles de una chacra específica y sus cálculos
   */
  getChacra(id: number): Observable<Chacra> {
    // Si el ID es temporal (negativo) o no hay conexión, resolver desde almacenamiento local
    if (id < 0 || !this.isOnline) {
      const local = this.offlineStorage.getLocalChacra(id);
      if (local) {
        const localCalculos = this.offlineStorage.getLocalCalculos(id);
        return of({
          ...local,
          calculos: localCalculos,
        });
      }
    }

    return from(
      this.supabase.client
        .from('chacras')
        .select('*, calculos_suelo(*)')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return {
          id: Number(data.id),
          nombre: data.nombre,
          areaHa: String(data.area_ha),
          ubicacion: data.ubicacion || undefined,
          descripcion: data.descripcion || undefined,
          usuarioId: data.usuario_id,
          calculos: data.calculos_suelo || [],
        };
      }),
      catchError((err) => {
        console.warn(`[ChacrasService] Error al obtener chacra ${id} desde Supabase, fallback a local:`, err);
        const local = this.offlineStorage.getLocalChacra(id);
        if (local) {
          const localCalculos = this.offlineStorage.getLocalCalculos(id);
          return of({ ...local, calculos: localCalculos });
        }
        throw err;
      })
    );
  }

  /**
   * Crea una nueva chacra. Si no hay conexión a internet o Supabase falla,
   * se guarda en almacenamiento local con ID temporal y estado PENDING.
   */
  createChacra(data: CreateChacraDto): Observable<Chacra> {
    const uid = this.firebaseAuth.currentUserUid;
    if (!uid) {
      throw new Error('Usuario no autenticado para crear chacra');
    }

    // Modo Offline directo
    if (!this.isOnline) {
      const localChacra = this.offlineStorage.addPendingChacra(uid, data);
      return of(localChacra);
    }

    // Modo Online con fallback local
    return from(
      this.supabase.client
        .from('chacras')
        .insert({
          usuario_id: uid,
          nombre: data.nombre,
          area_ha: data.areaHa,
          ubicacion: data.ubicacion || null,
          descripcion: data.descripcion || null,
        })
        .select()
        .single()
    ).pipe(
      map(({ data: res, error }) => {
        if (error) throw error;
        const nuevaChacra: LocalChacra = {
          id: Number(res.id),
          nombre: res.nombre,
          areaHa: String(res.area_ha),
          ubicacion: res.ubicacion || undefined,
          descripcion: res.descripcion || undefined,
          usuarioId: res.usuario_id,
          totalCalculos: 0,
          syncStatus: 'SYNCED',
        };

        // Guardar en la lista local
        const locales = this.offlineStorage.getLocalChacras(uid);
        locales.unshift(nuevaChacra);
        this.offlineStorage.saveLocalChacras(uid, locales);

        return nuevaChacra;
      }),
      catchError((err) => {
        console.warn('[ChacrasService] Error al insertar en Supabase, guardando localmente como pendiente:', err);
        const localChacra = this.offlineStorage.addPendingChacra(uid, data);
        return of(localChacra);
      })
    );
  }

  /**
   * Actualiza una chacra existente
   */
  updateChacra(id: number, data: UpdateChacraDto): Observable<Chacra> {
    const uid = this.firebaseAuth.currentUserUid;

    // Si es ID temporal o estamos offline, actualizar localmente
    if (id < 0 || !this.isOnline) {
      const local = this.offlineStorage.getLocalChacra(id);
      if (local) {
        if (data.nombre !== undefined) local.nombre = data.nombre;
        if (data.areaHa !== undefined) local.areaHa = String(data.areaHa);
        if (data.ubicacion !== undefined) local.ubicacion = data.ubicacion;
        if (data.descripcion !== undefined) local.descripcion = data.descripcion;
        local.syncStatus = 'PENDING';
        if (uid) {
          const all = this.offlineStorage.getLocalChacras(uid);
          const idx = all.findIndex((c) => Number(c.id) === Number(id));
          if (idx >= 0) all[idx] = local;
          this.offlineStorage.saveLocalChacras(uid, all);
        }
        return of(local);
      }
    }

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (data.nombre !== undefined) updatePayload.nombre = data.nombre;
    if (data.areaHa !== undefined) updatePayload.area_ha = data.areaHa;
    if (data.ubicacion !== undefined) updatePayload.ubicacion = data.ubicacion;
    if (data.descripcion !== undefined) updatePayload.descripcion = data.descripcion;

    return from(
      this.supabase.client
        .from('chacras')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data: res, error }) => {
        if (error) throw error;
        return {
          id: Number(res.id),
          nombre: res.nombre,
          areaHa: String(res.area_ha),
          ubicacion: res.ubicacion || undefined,
          descripcion: res.descripcion || undefined,
          usuarioId: res.usuario_id,
        };
      })
    );
  }

  /**
   * Elimina una chacra (con borrado en cascada local y en Supabase si es online)
   */
  deleteChacra(id: number): Observable<{ message: string }> {
    // Siempre eliminar del almacenamiento local
    this.offlineStorage.deleteLocalChacra(id);

    // Si era una chacra temporal que aún no se sincronizaba, terminar de inmediato
    if (id < 0 || !this.isOnline) {
      return of({ message: 'Chacra local eliminada correctamente' });
    }

    return from(
      this.supabase.client
        .from('chacras')
        .delete()
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return { message: 'Chacra eliminada correctamente' };
      }),
      catchError((err) => {
        console.warn(`[ChacrasService] Error al eliminar chacra ${id} en Supabase:`, err);
        return of({ message: 'Chacra eliminada localmente' });
      })
    );
  }

  /**
   * Obtiene la lista resumida de análisis realizados en una chacra
   */
  getCalculos(chacraId: number): Observable<CalculoResumen[]> {
    if (chacraId < 0 || !this.isOnline) {
      const locales = this.offlineStorage.getLocalCalculos(chacraId);
      return of(
        locales.map((c) => ({
          id: c.id,
          fecha: c.fecha,
          nombreMuestra: c.nombreMuestra,
          metaRendimiento: c.datosEntrada?.metaRendimiento,
          ph: c.datosEntrada?.ph,
          alertasCount: c.resultados?.alertas?.length || 0,
          syncStatus: c.syncStatus,
        }))
      );
    }

    return from(
      this.supabase.client
        .from('calculos_suelo')
        .select('id, created_at, nombre_muestra, datos_entrada, resultados')
        .eq('chacra_id', chacraId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;

        const serverCalculos: CalculoResumen[] = (data || []).map((row: any) => ({
          id: Number(row.id),
          fecha: row.created_at,
          nombreMuestra: row.nombre_muestra,
          metaRendimiento: row.datos_entrada?.metaRendimiento,
          ph: row.datos_entrada?.ph,
          alertasCount: row.resultados?.alertas?.length || 0,
          syncStatus: 'SYNCED',
        }));

        // Añadir cálculos pendientes de sincronización para esta chacra
        const pending = this.offlineStorage
          .getLocalCalculos(chacraId)
          .filter((c) => c.syncStatus === 'PENDING')
          .map((c) => ({
            id: c.id,
            fecha: c.fecha,
            nombreMuestra: c.nombreMuestra,
            metaRendimiento: c.datosEntrada?.metaRendimiento,
            ph: c.datosEntrada?.ph,
            alertasCount: c.resultados?.alertas?.length || 0,
            syncStatus: c.syncStatus,
          }));

        return [...pending, ...serverCalculos];
      }),
      catchError((err) => {
        console.warn(`[ChacrasService] Fallo al leer cálculos de chacra ${chacraId}, usando local:`, err);
        const locales = this.offlineStorage.getLocalCalculos(chacraId);
        return of(
          locales.map((c) => ({
            id: c.id,
            fecha: c.fecha,
            nombreMuestra: c.nombreMuestra,
            metaRendimiento: c.datosEntrada?.metaRendimiento,
            ph: c.datosEntrada?.ph,
            alertasCount: c.resultados?.alertas?.length || 0,
            syncStatus: c.syncStatus,
          }))
        );
      })
    );
  }

  /**
   * Obtiene los datos completos y resultados de un cálculo específico
   */
  getCalculo(chacraId: number, calculoId: number): Observable<CalculoDetalle> {
    if (calculoId < 0 || !this.isOnline) {
      const local = this.offlineStorage.getLocalCalculo(chacraId, calculoId);
      if (local) {
        return of({
          id: local.id,
          fecha: local.fecha,
          nombreMuestra: local.nombreMuestra,
          datosEntrada: local.datosEntrada,
          resultados: local.resultados,
          syncStatus: local.syncStatus,
        });
      }
    }

    return from(
      this.supabase.client
        .from('calculos_suelo')
        .select('*')
        .eq('id', calculoId)
        .eq('chacra_id', chacraId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return {
          id: Number(data.id),
          fecha: data.created_at,
          nombreMuestra: data.nombre_muestra,
          datosEntrada: data.datos_entrada,
          resultados: data.resultados,
          syncStatus: 'SYNCED' as const,
        };
      }),
      catchError((err) => {
        console.warn(`[ChacrasService] Error al obtener cálculo ${calculoId} en Supabase, buscando local:`, err);
        const local = this.offlineStorage.getLocalCalculo(chacraId, calculoId);
        if (local) {
          return of({
            id: local.id,
            fecha: local.fecha,
            nombreMuestra: local.nombreMuestra,
            datosEntrada: local.datosEntrada,
            resultados: local.resultados,
            syncStatus: local.syncStatus,
          });
        }
        throw err;
      })
    );
  }

  /**
   * Elimina un cálculo específico (localmente y en Supabase si está online)
   */
  deleteCalculo(chacraId: number, calculoId: number): Observable<{ message: string }> {
    // Siempre eliminar del almacenamiento local
    this.offlineStorage.deleteLocalCalculo(chacraId, calculoId);

    // Si es cálculo temporal offline, terminar
    if (calculoId < 0 || !this.isOnline) {
      return of({ message: 'Cálculo local eliminado correctamente' });
    }

    return from(
      this.supabase.client
        .from('calculos_suelo')
        .delete()
        .eq('id', calculoId)
        .eq('chacra_id', chacraId)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return { message: 'Cálculo eliminado correctamente de la nube' };
      }),
      catchError((err) => {
        console.warn(`[ChacrasService] Error al eliminar cálculo ${calculoId} en Supabase:`, err);
        return of({ message: 'Cálculo eliminado localmente' });
      })
    );
  }
}
