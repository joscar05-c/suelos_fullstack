import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonicModule,
  AlertController,
  ToastController,
  LoadingController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  refreshOutline,
  addOutline,
  trashOutline,
  leafOutline,
  flaskOutline,
  sparklesOutline,
  layersOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  speedometerOutline,
  closeOutline,
  saveOutline,
  cloudDoneOutline,
  cloudOfflineOutline,
  cubeOutline,
  scaleOutline,
} from 'ionicons/icons';
import { AdminService, CultivoAgrupado } from '../../core/services/admin.service';
import { SueloService } from '../../services/suelo.service';
import { SyncService } from '../../core/services/sync.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
})
export class AdminPage implements OnInit {
  private adminService = inject(AdminService);
  private sueloService = inject(SueloService);
  private syncService = inject(SyncService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private fb = inject(FormBuilder);

  // Pestaña activa ('cultivos' | 'fertilizantes')
  seccionActiva: 'cultivos' | 'fertilizantes' = 'cultivos';

  // Datos
  cultivosAgrupados: CultivoAgrupado[] = [];
  fertilizantes: any[] = [];
  cargando = false;
  isOnline = true;

  // Filtro de fertilizantes
  filtroFertilizante = 'TODOS';

  // Modal de Cultivo / Meta
  mostrarModalMeta = false;
  modoNuevoCultivo = false;
  cultivoSeleccionadoParaMeta = '';
  formMeta!: FormGroup;

  // Modal de Fertilizante
  mostrarModalFertilizante = false;
  formFertilizante!: FormGroup;

  constructor() {
    addIcons({
      arrowBackOutline,
      refreshOutline,
      addOutline,
      trashOutline,
      leafOutline,
      flaskOutline,
      sparklesOutline,
      layersOutline,
      checkmarkCircleOutline,
      informationCircleOutline,
      speedometerOutline,
      closeOutline,
      saveOutline,
      cloudDoneOutline,
      cloudOfflineOutline,
      cubeOutline,
      scaleOutline,
    });

    this.initForms();
  }

  ngOnInit() {
    this.syncService.isOnline$.subscribe((online) => (this.isOnline = online));
    this.cargarDatos();
  }

  private initForms() {
    this.formMeta = this.fb.group({
      cultivo: ['', [Validators.required, Validators.minLength(2)]],
      metaQuintales: [null, [Validators.required, Validators.min(1)]],
      n: [null, [Validators.required, Validators.min(0)]],
      p2o5: [null, [Validators.required, Validators.min(0)]],
      k2o: [null, [Validators.required, Validators.min(0)]],
      cao: [0, [Validators.min(0)]],
      mgo: [0, [Validators.min(0)]],
      s: [0, [Validators.min(0)]],
      b: [0, [Validators.min(0)]],
      cu: [0, [Validators.min(0)]],
      zn: [0, [Validators.min(0)]],
      mn: [0, [Validators.min(0)]],
      fe: [0, [Validators.min(0)]],
    });

    this.formFertilizante = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      clasificacion: ['NITROGENADO', [Validators.required]],
      porc_n: [0, [Validators.min(0), Validators.max(100)]],
      porc_p2o5: [0, [Validators.min(0), Validators.max(100)]],
      porc_k2o: [0, [Validators.min(0), Validators.max(100)]],
      porc_cao: [0, [Validators.min(0), Validators.max(100)]],
      porc_mgo: [0, [Validators.min(0), Validators.max(100)]],
      porc_s: [0, [Validators.min(0), Validators.max(100)]],
    });
  }

  cargarDatos() {
    this.cargando = true;
    this.adminService.getCultivosAgrupados().subscribe({
      next: (cultivos) => {
        this.cultivosAgrupados = cultivos;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando cultivos:', err);
        this.cargando = false;
        this.mostrarToast('Error al cargar cultivos desde la base de datos', 'danger');
      },
    });

    this.adminService.getFertilizantes().subscribe({
      next: (ferts) => {
        this.fertilizantes = ferts;
      },
      error: (err) => {
        console.error('Error cargando fertilizantes:', err);
      },
    });
  }

  cambiarSeccion(event: any) {
    this.seccionActiva = event.detail.value;
  }

  get fertilizantesFiltrados(): any[] {
    if (this.filtroFertilizante === 'TODOS') return this.fertilizantes;
    return this.fertilizantes.filter(
      (f) => f.clasificacion?.toUpperCase() === this.filtroFertilizante.toUpperCase()
    );
  }

  // ============================================
  // ACCIONES DE CULTIVOS Y METAS
  // ============================================

  abrirModalNuevoCultivo() {
    this.modoNuevoCultivo = true;
    this.cultivoSeleccionadoParaMeta = '';
    this.formMeta.reset({
      cultivo: '',
      metaQuintales: null,
      n: null,
      p2o5: null,
      k2o: null,
      cao: 0,
      mgo: 0,
      s: 0,
      b: 0,
      cu: 0,
      zn: 0,
      mn: 0,
      fe: 0,
    });
    this.mostrarModalMeta = true;
  }

  abrirModalNuevaMeta(cultivo: string) {
    this.modoNuevoCultivo = false;
    this.cultivoSeleccionadoParaMeta = cultivo;
    this.formMeta.reset({
      cultivo: cultivo,
      metaQuintales: null,
      n: null,
      p2o5: null,
      k2o: null,
      cao: 0,
      mgo: 0,
      s: 0,
      b: 0,
      cu: 0,
      zn: 0,
      mn: 0,
      fe: 0,
    });
    this.mostrarModalMeta = true;
  }

  cerrarModalMeta() {
    this.mostrarModalMeta = false;
  }

  async guardarMeta() {
    if (this.formMeta.invalid) {
      this.mostrarToast('Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    const val = this.formMeta.value;
    const loader = await this.loadingCtrl.create({
      message: 'Guardando en Supabase y actualizando caché...',
      spinner: 'crescent',
    });
    await loader.present();

    this.adminService
      .crearRequerimiento({
        cultivo: val.cultivo.trim(),
        metaQuintales: Number(val.metaQuintales),
        n: Number(val.n),
        p2o5: Number(val.p2o5),
        k2o: Number(val.k2o),
        cao: Number(val.cao || 0),
        mgo: Number(val.mgo || 0),
        s: Number(val.s || 0),
        b: Number(val.b || 0),
        cu: Number(val.cu || 0),
        zn: Number(val.zn || 0),
        mn: Number(val.mn || 0),
        fe: Number(val.fe || 0),
      })
      .subscribe({
        next: async () => {
          await loader.dismiss();
          this.mostrarModalMeta = false;
          this.mostrarToast(
            `Meta de ${val.metaQuintales} qq/ha para ${val.cultivo} guardada y lista para funcionar offline`,
            'success'
          );
          this.cargarDatos();
        },
        error: async (err) => {
          await loader.dismiss();
          console.error('Error guardando meta:', err);
          this.mostrarToast('Error al guardar la meta en la base de datos', 'danger');
        },
      });
  }

  async confirmarEliminarMeta(req: any) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Meta',
      message: `¿Deseas eliminar la meta de <strong>${req.metaQuintales} qq/ha</strong> para <strong>${req.cultivo}</strong>?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.ejecutarEliminarMeta(req.id);
          },
        },
      ],
    });
    await alert.present();
  }

  async ejecutarEliminarMeta(id: number) {
    const loader = await this.loadingCtrl.create({ message: 'Eliminando meta...' });
    await loader.present();

    this.adminService.eliminarRequerimiento(id).subscribe({
      next: async () => {
        await loader.dismiss();
        this.mostrarToast('Meta eliminada y caché actualizada', 'success');
        this.cargarDatos();
      },
      error: async (err) => {
        await loader.dismiss();
        console.error('Error eliminando meta:', err);
        this.mostrarToast('Error al eliminar meta', 'danger');
      },
    });
  }

  async confirmarEliminarCultivo(cultivo: string) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Cultivo Completo',
      message: `¿Estás seguro de eliminar el cultivo <strong>"${cultivo}"</strong> y todas sus tablas de requerimientos? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar Todo',
          role: 'destructive',
          handler: () => {
            this.ejecutarEliminarCultivo(cultivo);
          },
        },
      ],
    });
    await alert.present();
  }

  async ejecutarEliminarCultivo(cultivo: string) {
    const loader = await this.loadingCtrl.create({ message: 'Eliminando cultivo...' });
    await loader.present();

    this.adminService.eliminarCultivoCompleto(cultivo).subscribe({
      next: async () => {
        await loader.dismiss();
        this.mostrarToast(`Cultivo "${cultivo}" eliminado correctamente`, 'success');
        this.cargarDatos();
      },
      error: async (err) => {
        await loader.dismiss();
        console.error('Error eliminando cultivo:', err);
        this.mostrarToast('Error al eliminar cultivo', 'danger');
      },
    });
  }

  // ============================================
  // ACCIONES DE FERTILIZANTES COMERCIALES
  // ============================================

  abrirModalNuevoFertilizante() {
    this.formFertilizante.reset({
      nombre: '',
      clasificacion: 'NITROGENADO',
      porc_n: 0,
      porc_p2o5: 0,
      porc_k2o: 0,
      porc_cao: 0,
      porc_mgo: 0,
      porc_s: 0,
    });
    this.mostrarModalFertilizante = true;
  }

  cerrarModalFertilizante() {
    this.mostrarModalFertilizante = false;
  }

  async guardarFertilizante() {
    if (this.formFertilizante.invalid) {
      this.mostrarToast('Completa el nombre y la clasificación', 'warning');
      return;
    }

    const val = this.formFertilizante.value;
    const totalNutrientes =
      Number(val.porc_n || 0) +
      Number(val.porc_p2o5 || 0) +
      Number(val.porc_k2o || 0) +
      Number(val.porc_cao || 0) +
      Number(val.porc_mgo || 0) +
      Number(val.porc_s || 0);

    if (totalNutrientes <= 0) {
      this.mostrarToast('El fertilizante debe tener al menos un porcentaje de nutriente mayor a 0%', 'warning');
      return;
    }

    const loader = await this.loadingCtrl.create({
      message: 'Registrando fertilizante y actualizando catálogos...',
    });
    await loader.present();

    this.adminService
      .crearFertilizante({
        nombre: val.nombre.trim(),
        clasificacion: val.clasificacion,
        porc_n: Number(val.porc_n || 0),
        porc_p2o5: Number(val.porc_p2o5 || 0),
        porc_k2o: Number(val.porc_k2o || 0),
        porc_cao: Number(val.porc_cao || 0),
        porc_mgo: Number(val.porc_mgo || 0),
        porc_s: Number(val.porc_s || 0),
      })
      .subscribe({
        next: async () => {
          await loader.dismiss();
          this.mostrarModalFertilizante = false;
          this.mostrarToast(`Fertilizante "${val.nombre}" guardado y disponible para cálculos`, 'success');
          this.cargarDatos();
        },
        error: async (err) => {
          await loader.dismiss();
          console.error('Error guardando fertilizante:', err);
          this.mostrarToast('Error al guardar fertilizante', 'danger');
        },
      });
  }

  async confirmarEliminarFertilizante(f: any) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Fertilizante',
      message: `¿Deseas eliminar el fertilizante <strong>"${f.nombre}"</strong>?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.ejecutarEliminarFertilizante(f.id);
          },
        },
      ],
    });
    await alert.present();
  }

  async ejecutarEliminarFertilizante(id: number) {
    const loader = await this.loadingCtrl.create({ message: 'Eliminando fertilizante...' });
    await loader.present();

    this.adminService.eliminarFertilizante(id).subscribe({
      next: async () => {
        await loader.dismiss();
        this.mostrarToast('Fertilizante eliminado y catálogo actualizado', 'success');
        this.cargarDatos();
      },
      error: async (err) => {
        await loader.dismiss();
        console.error('Error eliminando fertilizante:', err);
        this.mostrarToast('Error al eliminar fertilizante', 'danger');
      },
    });
  }

  // ============================================
  // UTILITARIOS Y SINCRONIZACIÓN MANUAL
  // ============================================

  async forzarSincronizacionOffline() {
    if (!this.isOnline) {
      this.mostrarToast('No hay conexión a internet para refrescar desde Supabase', 'warning');
      return;
    }
    const loader = await this.loadingCtrl.create({
      message: 'Descargando catálogos y actualizando almacenamiento sin conexión...',
    });
    await loader.present();

    this.sueloService.syncCatalogosFromSupabase().subscribe({
      next: async () => {
        await loader.dismiss();
        this.cargarDatos();
        this.mostrarToast('✅ Catálogos actualizados y guardados en tu dispositivo para uso sin conexión', 'success');
      },
      error: async () => {
        await loader.dismiss();
        this.mostrarToast('Error al sincronizar catálogos', 'danger');
      },
    });
  }

  volver() {
    this.router.navigate(['/dashboard']);
  }

  async mostrarToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
