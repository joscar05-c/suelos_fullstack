import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { SueloService } from '../../services/suelo.service';
import { FuenteFertilizante, RequerimientoCultivo } from '../domain/models/agronomic.models';

export interface CultivoAgrupado {
  cultivo: string;
  totalMetas: number;
  requerimientos: any[];
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private supabase = inject(SupabaseService);
  private sueloService = inject(SueloService);

  // ============================================
  // GESTIÓN DE CULTIVOS Y REQUERIMIENTOS
  // ============================================

  /**
   * Obtiene todos los cultivos y sus tablas de requerimientos agrupadas
   */
  getCultivosAgrupados(): Observable<CultivoAgrupado[]> {
    return from(
      this.supabase.client
        .from('requerimientos_cultivo')
        .select('*')
        .order('cultivo', { ascending: true })
        .order('meta_quintales', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;

        const mapCultivos = new Map<string, any[]>();
        for (const row of (data || [])) {
          const c = row.cultivo;
          if (!mapCultivos.has(c)) {
            mapCultivos.set(c, []);
          }
          mapCultivos.get(c)!.push({
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
          });
        }

        const result: CultivoAgrupado[] = [];
        for (const [cultivo, reqs] of mapCultivos.entries()) {
          result.push({
            cultivo,
            totalMetas: reqs.length,
            requerimientos: reqs.sort((a, b) => a.metaQuintales - b.metaQuintales),
          });
        }
        return result;
      })
    );
  }

  /**
   * Agrega una nueva meta de requerimiento para un cultivo
   */
  crearRequerimiento(req: {
    cultivo: string;
    metaQuintales: number;
    n: number;
    p2o5: number;
    k2o: number;
    cao?: number;
    mgo?: number;
    s?: number;
    b?: number;
    cu?: number;
    zn?: number;
    mn?: number;
    fe?: number;
  }): Observable<any> {
    const payload = {
      cultivo: req.cultivo.trim(),
      meta_quintales: req.metaQuintales,
      n: req.n,
      p2o5: req.p2o5,
      k2o: req.k2o,
      cao: req.cao || 0,
      mgo: req.mgo || 0,
      s: req.s || 0,
      b: req.b || 0,
      cu: req.cu || 0,
      zn: req.zn || 0,
      mn: req.mn || 0,
      fe: req.fe || 0,
    };

    return from(
      this.supabase.client
        .from('requerimientos_cultivo')
        .insert(payload)
        .select()
        .single()
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        // Refrescar automáticamente la caché local para que funcione offline
        return this.sueloService.syncCatalogosFromSupabase().pipe(map(() => data));
      })
    );
  }

  /**
   * Elimina un requerimiento específico por ID
   */
  eliminarRequerimiento(id: number): Observable<boolean> {
    return from(
      this.supabase.client
        .from('requerimientos_cultivo')
        .delete()
        .eq('id', id)
    ).pipe(
      switchMap(({ error }) => {
        if (error) throw error;
        return this.sueloService.syncCatalogosFromSupabase();
      })
    );
  }

  /**
   * Elimina un cultivo completo y todos sus requerimientos
   */
  eliminarCultivoCompleto(cultivo: string): Observable<boolean> {
    return from(
      this.supabase.client
        .from('requerimientos_cultivo')
        .delete()
        .ilike('cultivo', cultivo)
    ).pipe(
      switchMap(({ error }) => {
        if (error) throw error;
        return this.sueloService.syncCatalogosFromSupabase();
      })
    );
  }

  // ============================================
  // GESTIÓN DE FERTILIZANTES COMERCIALES
  // ============================================

  /**
   * Obtiene todos los fertilizantes comerciales registrados en Supabase
   */
  getFertilizantes(): Observable<any[]> {
    return from(
      this.supabase.client
        .from('fuentes_fertilizantes')
        .select('*')
        .order('id', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((row: any) => ({
          id: Number(row.id),
          nombre: row.nombre,
          clasificacion: row.clasificacion,
          porc_n: Number(row.porc_n || 0),
          porc_p2o5: Number(row.porc_p2o5 || 0),
          porc_k2o: Number(row.porc_k2o || 0),
          porc_cao: Number(row.porc_cao || 0),
          porc_mgo: Number(row.porc_mgo || 0),
          porc_s: Number(row.porc_s || 0),
        }));
      })
    );
  }

  /**
   * Registra un nuevo fertilizante comercial en Supabase
   */
  crearFertilizante(data: {
    nombre: string;
    clasificacion: string;
    porc_n: number;
    porc_p2o5: number;
    porc_k2o: number;
    porc_cao?: number;
    porc_mgo?: number;
    porc_s?: number;
  }): Observable<any> {
    return from(
      this.supabase.client
        .from('fuentes_fertilizantes')
        .insert(data)
        .select()
        .single()
    ).pipe(
      switchMap(({ data: res, error }) => {
        if (error) throw error;
        return this.sueloService.syncCatalogosFromSupabase().pipe(map(() => res));
      })
    );
  }

  /**
   * Elimina un fertilizante por ID
   */
  eliminarFertilizante(id: number): Observable<boolean> {
    return from(
      this.supabase.client
        .from('fuentes_fertilizantes')
        .delete()
        .eq('id', id)
    ).pipe(
      switchMap(({ error }) => {
        if (error) throw error;
        return this.sueloService.syncCatalogosFromSupabase();
      })
    );
  }
}
