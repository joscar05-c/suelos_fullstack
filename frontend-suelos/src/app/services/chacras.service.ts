import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { SupabaseService } from '../core/services/supabase.service';
import { FirebaseAuthService } from './firebase-auth.service';

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
  providedIn: 'root',
})
export class ChacrasService {
  private supabase = inject(SupabaseService);
  private firebaseAuth = inject(FirebaseAuthService);

  /**
   * Obtiene todas las parcelas/chacras del usuario autenticado
   * Utiliza la vista v_chacras_resumen con total de análisis y última fecha
   */
  getChacras(): Observable<Chacra[]> {
    const uid = this.firebaseAuth.currentUserUid;
    if (!uid) {
      return of([]);
    }

    return from(
      this.supabase.client
        .from('v_chacras_resumen')
        .select('*')
        .eq('usuario_id', uid)
        .order('createdAt', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error al listar chacras desde Supabase:', error);
          throw error;
        }
        return (data || []).map((row: any) => ({
          id: Number(row.id),
          nombre: row.nombre,
          areaHa: String(row.areaHa),
          ubicacion: row.ubicacion || undefined,
          descripcion: row.descripcion || undefined,
          totalCalculos: row.totalCalculos || 0,
          ultimoCalculo: row.ultimoCalculo || undefined,
          usuarioId: row.usuario_id,
        }));
      })
    );
  }

  /**
   * Obtiene los detalles de una chacra específica y sus cálculos
   */
  getChacra(id: number): Observable<Chacra> {
    return from(
      this.supabase.client
        .from('chacras')
        .select('*, calculos_suelo(*)')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error(`Error al obtener chacra ${id}:`, error);
          throw error;
        }
        return {
          id: Number(data.id),
          nombre: data.nombre,
          areaHa: String(data.area_ha),
          ubicacion: data.ubicacion || undefined,
          descripcion: data.descripcion || undefined,
          usuarioId: data.usuario_id,
          calculos: data.calculos_suelo || [],
        };
      })
    );
  }

  /**
   * Crea una nueva chacra en Supabase vinculada al UID de Firebase
   */
  createChacra(data: CreateChacraDto): Observable<Chacra> {
    const uid = this.firebaseAuth.currentUserUid;
    if (!uid) {
      throw new Error('Usuario no autenticado para crear chacra');
    }

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
        if (error) {
          console.error('Error al crear chacra en Supabase:', error);
          throw error;
        }
        return {
          id: Number(res.id),
          nombre: res.nombre,
          areaHa: String(res.area_ha),
          ubicacion: res.ubicacion || undefined,
          descripcion: res.descripcion || undefined,
          usuarioId: res.usuario_id,
          totalCalculos: 0,
        };
      })
    );
  }

  /**
   * Actualiza una chacra existente
   */
  updateChacra(id: number, data: UpdateChacraDto): Observable<Chacra> {
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
        if (error) {
          console.error(`Error al actualizar chacra ${id}:`, error);
          throw error;
        }
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
   * Elimina una chacra (con borrado en cascada de sus cálculos en Supabase)
   */
  deleteChacra(id: number): Observable<{ message: string }> {
    return from(
      this.supabase.client
        .from('chacras')
        .delete()
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) {
          console.error(`Error al eliminar chacra ${id}:`, error);
          throw error;
        }
        return { message: 'Chacra eliminada correctamente' };
      })
    );
  }

  /**
   * Obtiene la lista resumida de análisis realizados en una chacra
   */
  getCalculos(chacraId: number): Observable<CalculoResumen[]> {
    return from(
      this.supabase.client
        .from('calculos_suelo')
        .select('id, created_at, nombre_muestra, datos_entrada, resultados')
        .eq('chacra_id', chacraId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error(`Error al obtener cálculos de chacra ${chacraId}:`, error);
          throw error;
        }
        return (data || []).map((row: any) => ({
          id: Number(row.id),
          fecha: row.created_at,
          nombreMuestra: row.nombre_muestra,
          metaRendimiento: row.datos_entrada?.metaRendimiento,
          ph: row.datos_entrada?.ph,
          alertasCount: row.resultados?.alertas?.length || 0,
        }));
      })
    );
  }

  /**
   * Obtiene los datos completos y resultados de un cálculo específico
   */
  getCalculo(chacraId: number, calculoId: number): Observable<CalculoDetalle> {
    return from(
      this.supabase.client
        .from('calculos_suelo')
        .select('*')
        .eq('id', calculoId)
        .eq('chacra_id', chacraId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error(`Error al obtener cálculo ${calculoId}:`, error);
          throw error;
        }
        return {
          id: Number(data.id),
          fecha: data.created_at,
          nombreMuestra: data.nombre_muestra,
          datosEntrada: data.datos_entrada,
          resultados: data.resultados,
        };
      })
    );
  }
}
