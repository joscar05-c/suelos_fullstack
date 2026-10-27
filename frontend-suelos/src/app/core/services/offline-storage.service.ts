import { Injectable } from '@angular/core';
import { Chacra, CalculoResumen, CalculoDetalle } from '../../services/chacras.service';

export interface LocalChacra extends Chacra {
  syncStatus: 'SYNCED' | 'PENDING';
  localOnly?: boolean;
}

export interface LocalCalculo {
  id: number;
  chacraId: number;
  usuarioId: string;
  nombreMuestra: string;
  datosEntrada: any;
  resultados: any;
  fecha: string;
  syncStatus: 'SYNCED' | 'PENDING';
}

@Injectable({
  providedIn: 'root',
})
export class OfflineStorageService {
  private readonly CHACRAS_KEY = 'suelos_offline_chacras';
  private readonly CALCULOS_KEY = 'suelos_offline_calculos';

  constructor() {}

  // ============================================
  // GESTIÓN DE CHACRAS EN ALMACENAMIENTO LOCAL
  // ============================================

  /**
   * Obtiene todas las chacras almacenadas localmente para un usuario
   */
  getLocalChacras(usuarioId: string): LocalChacra[] {
    try {
      const raw = localStorage.getItem(this.CHACRAS_KEY);
      if (!raw) return [];
      const all: LocalChacra[] = JSON.parse(raw);
      return all.filter((c) => String(c.usuarioId) === String(usuarioId));
    } catch (e) {
      console.error('Error al leer chacras de localStorage:', e);
      return [];
    }
  }

  /**
   * Guarda o actualiza la lista completa de chacras de un usuario en local
   */
  saveLocalChacras(usuarioId: string, chacras: LocalChacra[]): void {
    try {
      const raw = localStorage.getItem(this.CHACRAS_KEY);
      let all: LocalChacra[] = raw ? JSON.parse(raw) : [];
      // Filtrar chacras de otros usuarios para no borrarlas
      all = all.filter((c) => String(c.usuarioId) !== String(usuarioId));
      all.push(...chacras);
      localStorage.setItem(this.CHACRAS_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Error al guardar chacras en localStorage:', e);
    }
  }

  /**
   * Agrega una nueva chacra en estado PENDING (creada sin internet)
   */
  addPendingChacra(usuarioId: string, data: { nombre: string; areaHa: number; ubicacion?: string; descripcion?: string }): LocalChacra {
    const raw = localStorage.getItem(this.CHACRAS_KEY);
    const all: LocalChacra[] = raw ? JSON.parse(raw) : [];

    // Generar un ID negativo temporal para no colisionar con IDs de Supabase
    const tempId = -Math.abs(Date.now());

    const nuevaChacra: LocalChacra = {
      id: tempId,
      nombre: data.nombre,
      areaHa: String(data.areaHa),
      ubicacion: data.ubicacion,
      descripcion: data.descripcion,
      totalCalculos: 0,
      usuarioId,
      syncStatus: 'PENDING',
      localOnly: true,
    };

    all.unshift(nuevaChacra);
    localStorage.setItem(this.CHACRAS_KEY, JSON.stringify(all));
    return nuevaChacra;
  }

  /**
   * Obtiene una chacra local específica por su ID
   */
  getLocalChacra(id: number): LocalChacra | null {
    try {
      const raw = localStorage.getItem(this.CHACRAS_KEY);
      if (!raw) return null;
      const all: LocalChacra[] = JSON.parse(raw);
      return all.find((c) => Number(c.id) === Number(id)) || null;
    } catch (e) {
      console.error('Error al leer chacra local:', e);
      return null;
    }
  }

  /**
   * Elimina una chacra local
   */
  deleteLocalChacra(id: number): void {
    try {
      const raw = localStorage.getItem(this.CHACRAS_KEY);
      if (!raw) return;
      let all: LocalChacra[] = JSON.parse(raw);
      all = all.filter((c) => Number(c.id) !== Number(id));
      localStorage.setItem(this.CHACRAS_KEY, JSON.stringify(all));

      // También eliminar sus cálculos locales
      this.deleteCalculosByChacra(id);
    } catch (e) {
      console.error('Error al eliminar chacra local:', e);
    }
  }

  /**
   * Actualiza el ID temporal de una chacra cuando Supabase le asigna su ID definitivo
   */
  updateChacraIdAfterSync(tempId: number, realId: number): void {
    try {
      const raw = localStorage.getItem(this.CHACRAS_KEY);
      if (!raw) return;
      const all: LocalChacra[] = JSON.parse(raw);
      const target = all.find((c) => c.id === tempId);
      if (target) {
        target.id = realId;
        target.syncStatus = 'SYNCED';
        delete target.localOnly;
        localStorage.setItem(this.CHACRAS_KEY, JSON.stringify(all));
      }

      // Actualizar también los cálculos que apuntaban al tempId
      this.updateCalculosChacraIdAfterSync(tempId, realId);
    } catch (e) {
      console.error('Error al actualizar ID de chacra post-sync:', e);
    }
  }

  // ============================================
  // GESTIÓN DE CÁLCULOS EN ALMACENAMIENTO LOCAL
  // ============================================

  /**
   * Obtiene todos los cálculos locales de una chacra
   */
  getLocalCalculos(chacraId: number): LocalCalculo[] {
    try {
      const raw = localStorage.getItem(this.CALCULOS_KEY);
      if (!raw) return [];
      const all: LocalCalculo[] = JSON.parse(raw);
      return all.filter((c) => Number(c.chacraId) === Number(chacraId));
    } catch (e) {
      console.error('Error al leer cálculos locales:', e);
      return [];
    }
  }

  /**
   * Guarda o actualiza cálculos locales
   */
  saveLocalCalculos(chacraId: number, calculos: LocalCalculo[]): void {
    try {
      const raw = localStorage.getItem(this.CALCULOS_KEY);
      let all: LocalCalculo[] = raw ? JSON.parse(raw) : [];
      all = all.filter((c) => Number(c.chacraId) !== Number(chacraId));
      all.push(...calculos);
      localStorage.setItem(this.CALCULOS_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('Error al guardar cálculos locales:', e);
    }
  }

  /**
   * Agrega un nuevo cálculo en estado PENDING (realizado sin internet)
   */
  addPendingCalculo(
    chacraId: number,
    usuarioId: string,
    nombreMuestra: string,
    datosEntrada: any,
    resultados: any
  ): LocalCalculo {
    const raw = localStorage.getItem(this.CALCULOS_KEY);
    const all: LocalCalculo[] = raw ? JSON.parse(raw) : [];

    const tempId = -Math.abs(Date.now());
    const nuevoCalculo: LocalCalculo = {
      id: tempId,
      chacraId,
      usuarioId,
      nombreMuestra,
      datosEntrada,
      resultados,
      fecha: new Date().toISOString(),
      syncStatus: 'PENDING',
    };

    all.unshift(nuevoCalculo);
    localStorage.setItem(this.CALCULOS_KEY, JSON.stringify(all));

    // Incrementar conteo de cálculos en la chacra local
    this.incrementarConteoChacra(chacraId, nuevoCalculo.fecha);

    return nuevoCalculo;
  }

  /**
   * Obtiene un cálculo local específico
   */
  getLocalCalculo(chacraId: number, calculoId: number): LocalCalculo | null {
    const calculos = this.getLocalCalculos(chacraId);
    return calculos.find((c) => Number(c.id) === Number(calculoId)) || null;
  }

  /**
   * Elimina cálculos asociados a una chacra
   */
  private deleteCalculosByChacra(chacraId: number): void {
    try {
      const raw = localStorage.getItem(this.CALCULOS_KEY);
      if (!raw) return;
      let all: LocalCalculo[] = JSON.parse(raw);
      all = all.filter((c) => Number(c.chacraId) !== Number(chacraId));
      localStorage.setItem(this.CALCULOS_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  private updateCalculosChacraIdAfterSync(oldId: number, newId: number): void {
    try {
      const raw = localStorage.getItem(this.CALCULOS_KEY);
      if (!raw) return;
      const all: LocalCalculo[] = JSON.parse(raw);
      all.forEach((c) => {
        if (Number(c.chacraId) === Number(oldId)) {
          c.chacraId = newId;
        }
      });
      localStorage.setItem(this.CALCULOS_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  private incrementarConteoChacra(chacraId: number, fecha: string): void {
    try {
      const raw = localStorage.getItem(this.CHACRAS_KEY);
      if (!raw) return;
      const all: LocalChacra[] = JSON.parse(raw);
      const target = all.find((c) => Number(c.id) === Number(chacraId));
      if (target) {
        target.totalCalculos = (target.totalCalculos || 0) + 1;
        target.ultimoCalculo = fecha;
        localStorage.setItem(this.CHACRAS_KEY, JSON.stringify(all));
      }
    } catch (e) {}
  }

  // ============================================
  // CONSULTA DE REGISTROS PENDIENTES DE SINCRONIZACIÓN
  // ============================================

  getPendingChacras(usuarioId: string): LocalChacra[] {
    return this.getLocalChacras(usuarioId).filter((c) => c.syncStatus === 'PENDING');
  }

  getPendingCalculos(usuarioId: string): LocalCalculo[] {
    try {
      const raw = localStorage.getItem(this.CALCULOS_KEY);
      if (!raw) return [];
      const all: LocalCalculo[] = JSON.parse(raw);
      return all.filter((c) => String(c.usuarioId) === String(usuarioId) && c.syncStatus === 'PENDING');
    } catch (e) {
      return [];
    }
  }

  markCalculoAsSynced(tempId: number, realId: number): void {
    try {
      const raw = localStorage.getItem(this.CALCULOS_KEY);
      if (!raw) return;
      const all: LocalCalculo[] = JSON.parse(raw);
      const target = all.find((c) => c.id === tempId);
      if (target) {
        target.id = realId;
        target.syncStatus = 'SYNCED';
        localStorage.setItem(this.CALCULOS_KEY, JSON.stringify(all));
      }
    } catch (e) {}
  }

  getTotalPendingCount(usuarioId: string): number {
    return this.getPendingChacras(usuarioId).length + this.getPendingCalculos(usuarioId).length;
  }
}

