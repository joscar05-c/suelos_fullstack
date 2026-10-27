import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { OfflineStorageService, LocalChacra, LocalCalculo } from './offline-storage.service';
import { FirebaseAuthService } from '../../services/firebase-auth.service';

export interface SyncReport {
  syncedChacras: number;
  syncedCalculos: number;
  errors: any[];
}

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  private supabase = inject(SupabaseService);
  private offlineStorage = inject(OfflineStorageService);
  private firebaseAuth = inject(FirebaseAuthService);

  private isOnlineSubject = new BehaviorSubject<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  public isOnline$: Observable<boolean> = this.isOnlineSubject.asObservable();

  private isSyncingSubject = new BehaviorSubject<boolean>(false);
  public isSyncing$: Observable<boolean> = this.isSyncingSubject.asObservable();

  private pendingCountSubject = new BehaviorSubject<number>(0);
  public pendingCount$: Observable<number> = this.pendingCountSubject.asObservable();

  constructor() {
    this.initNetworkListeners();
    this.refreshPendingCount();

    // Reaccionar a cambios de sesión para refrescar el conteo de pendientes
    this.firebaseAuth.appUser$.subscribe((user) => {
      if (user?.id) {
        this.refreshPendingCount();
        if (this.isOnlineSubject.value) {
          // Intentar sincronización automática al ingresar con conexión
          this.syncAll().catch((err) => console.warn('Sync inicial diferido:', err));
        }
      }
    });
  }

  public get isOnline(): boolean {
    return this.isOnlineSubject.value;
  }

  public get isSyncing(): boolean {
    return this.isSyncingSubject.value;
  }

  /**
   * Inicializa la escucha de eventos de red online/offline nativos del navegador / WebView
   */
  private initNetworkListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncService] Conexión a internet restablecida');
        this.isOnlineSubject.next(true);
        this.syncAll().catch((err) => console.error('[SyncService] Error en sync automático:', err));
      });

      window.addEventListener('offline', () => {
        console.log('[SyncService] Conexión perdida, pasando a modo Offline');
        this.isOnlineSubject.next(false);
      });
    }
  }

  /**
   * Actualiza el contador reactivo de elementos pendientes de sincronización
   */
  public refreshPendingCount(): number {
    const uid = this.firebaseAuth.currentUserUid;
    if (!uid) {
      this.pendingCountSubject.next(0);
      return 0;
    }
    const count = this.offlineStorage.getTotalPendingCount(uid);
    this.pendingCountSubject.next(count);
    return count;
  }

  /**
   * Ejecuta la sincronización bidireccional / push de todos los datos locales pendientes a Supabase
   */
  async syncAll(): Promise<SyncReport> {
    const report: SyncReport = {
      syncedChacras: 0,
      syncedCalculos: 0,
      errors: [],
    };

    const uid = this.firebaseAuth.currentUserUid;
    if (!uid || !this.isOnlineSubject.value || this.isSyncingSubject.value) {
      return report;
    }

    try {
      this.isSyncingSubject.next(true);

      // ============================================
      // 1. SINCRONIZAR CHACRAS PENDIENTES
      // ============================================
      const pendingChacras = this.offlineStorage.getPendingChacras(uid);
      for (const c of pendingChacras) {
        try {
          const { data, error } = await this.supabase.client
            .from('chacras')
            .insert({
              usuario_id: uid,
              nombre: c.nombre,
              area_ha: parseFloat(c.areaHa),
              ubicacion: c.ubicacion || null,
              descripcion: c.descripcion || null,
            })
            .select('id')
            .single();

          if (error) {
            console.error(`[SyncService] Error al sincronizar chacra ${c.nombre}:`, error);
            report.errors.push({ type: 'chacra', id: c.id, error });
          } else if (data?.id) {
            // Reemplazar ID temporal por el real en local storage y cálculos hijos
            this.offlineStorage.updateChacraIdAfterSync(c.id, Number(data.id));
            report.syncedChacras++;
          }
        } catch (err) {
          report.errors.push({ type: 'chacra', id: c.id, error: err });
        }
      }

      // ============================================
      // 2. SINCRONIZAR CÁLCULOS PENDIENTES
      // ============================================
      // Importante: Al actualizar las chacras arriba, los chacraId temporales ya fueron reemplazados
      const pendingCalculos = this.offlineStorage.getPendingCalculos(uid);
      for (const calc of pendingCalculos) {
        try {
          // Si el chacraId sigue siendo negativo (chacra no sincronizada aún), postergar
          if (calc.chacraId < 0) {
            console.warn(`[SyncService] Postergar cálculo ${calc.id}: chacra ${calc.chacraId} no sincronizada`);
            continue;
          }

          const { data, error } = await this.supabase.client
            .from('calculos_suelo')
            .insert({
              chacra_id: calc.chacraId,
              usuario_id: uid,
              nombre_muestra: calc.nombreMuestra,
              datos_entrada: calc.datosEntrada,
              resultados: calc.resultados,
            })
            .select('id')
            .single();

          if (error) {
            console.error(`[SyncService] Error al sincronizar cálculo ${calc.nombreMuestra}:`, error);
            report.errors.push({ type: 'calculo', id: calc.id, error });
          } else if (data?.id) {
            this.offlineStorage.markCalculoAsSynced(calc.id, Number(data.id));
            report.syncedCalculos++;
          }
        } catch (err) {
          report.errors.push({ type: 'calculo', id: calc.id, error: err });
        }
      }
    } finally {
      this.refreshPendingCount();
      this.isSyncingSubject.next(false);
    }

    return report;
  }
}
