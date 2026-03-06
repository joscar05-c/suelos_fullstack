import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  LoadingController,
  IonHeader,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonCol,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonList,
  IonChip,
  IonCardSubtitle,
  IonIcon,
  IonNote,
  IonButtons,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { SueloService } from '../services/suelo.service';
import { FirebaseAuthService } from '../services/firebase-auth.service';
import { ChacrasService, Chacra } from '../services/chacras.service';
import { RespuestaCalculo } from '../interfaces/suelo.interface';
import { forkJoin } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  warningOutline,
  logInOutline,
  listOutline,
  saveOutline,
  arrowBackOutline,
  arrowForwardOutline,
  calculatorOutline,
} from 'ionicons/icons';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonNote,
    IonCol,
    IonRow,
    IonCardSubtitle,
    IonButtons,
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonList,
    IonChip,
    IonIcon,
    IonSegment,
    IonSegmentButton,
  ],
})
export class HomePage implements OnInit {
  private fb = inject(FormBuilder);
  private sueloService = inject(SueloService);
  private firebaseAuth = inject(FirebaseAuthService);
  private chacrasService = inject(ChacrasService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  formularioSuelo: FormGroup;
  resultado: RespuestaCalculo | null = null;
  guardando = false;

  // Listas cargadas dinámicamente desde el Backend
  listaTexturas: any[] = [];
  listaZonas: any[] = [];
  listaNitrogeno: any[] = [];
  listaFosforo: any[] = [];
  listaPotasio: any[] = [];
  listaEnmiendas: any[] = [];

  // Cache para evitar recreación en cada render
  private _nutrientesCascadaCache: NutrienteCascada[] | null = null;

  // Cache para evitar recreación en cada render
  private _nutrientesCascadaCache: NutrienteCascada[] | null = null;

  vistaResultado: string = 'plan';

  pasoActual: number = 1; // Para la navegación paso a paso
  siguientePaso() {
    if (this.pasoActual < 6) {
      this.pasoActual++;
    }
  }

  anteriorPaso() {
    if (this.pasoActual > 1) {
      this.pasoActual--;
    }
  }

  constructor(private loadingCtrl: LoadingController) {
    // Registrar iconos
    addIcons({
      warningOutline,
      logInOutline,
      listOutline,
      saveOutline,
      arrowBackOutline,
      arrowForwardOutline,
      calculatorOutline,
    });

    // Valores por defecto del ejercicio de la Foto para probar rápido
    this.formularioSuelo = this.fb.group({
      areaHa: [1, [Validators.required, Validators.min(0)]],
      profundidadMetros: [0.15, [Validators.required, Validators.min(0)]],
      idTextura: [4, [Validators.required]], // Franco Arcilloso
      materiaOrganica: [3.0, [Validators.required]],
      fosforoPpm: [10.5, [Validators.required]],
      potasioPpm: [210, [Validators.required]],
      idZona: [4, [Validators.required]], // Selva Alta
      // Nuevos campos químicos con valores por defecto
      ph: [5.5, [Validators.required, Validators.min(0)]],
      ce: [0.5, [Validators.required, Validators.min(0)]],
      caIntercambiable: [8.0, [Validators.required, Validators.min(0)]],
      mgIntercambiable: [2.5, [Validators.required, Validators.min(0)]],
      kIntercambiable: [0.3, [Validators.required, Validators.min(0)]],
      naIntercambiable: [0.2, [Validators.required, Validators.min(0)]],
      acidezIntercambiable: [2.0, [Validators.required, Validators.min(0)]],
      // Micronutrientes (opcionales con valores por defecto)
      b_ppm: [0.5, [Validators.min(0)]],
      cu_ppm: [2.0, [Validators.min(0)]],
      zn_ppm: [3.0, [Validators.min(0)]],
      mn_ppm: [10.0, [Validators.min(0)]],
      fe_ppm: [50.0, [Validators.min(0)]],
      s_ppm: [null, [Validators.min(0)]], // Azufre (opcional)
      // Meta de rendimiento (quintales/ha)
      metaRendimiento: [40, [Validators.required, Validators.min(0)]],
      // Estrategia de fertilización - Selección de fuentes comerciales
      idFuenteN: [3, [Validators.required]], // Default: Urea (ID 3)
      idFuenteP: [5, [Validators.required]], // Default: Superfosfato Triple (ID 5)
      idFuenteK: [6, [Validators.required]], // Default: Cloruro de Potasio (ID 6)
      idFuenteCa: [19, [Validators.required]], // Default: Cal Agrícola (ID 19)
    });
  }

  ngOnInit() {
    // Cargar datos maestros desde el backend
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    forkJoin({
      texturas: this.sueloService.getTexturas(),
      zonas: this.sueloService.getZonas(),
      // ✅ USAR ENDPOINTS FILTRADOS CON INTELIGENCIA AGRONÓMICA
      nitrogeno: this.sueloService.getFertilizantesNitrogeno(),
      fosforo: this.sueloService.getFertilizantesFosforo(),
      potasio: this.sueloService.getFertilizantesPotasio(),
      enmiendas: this.sueloService.getEnmiendas(),
    }).subscribe({
      next: (catalogos) => {
        // Asignar texturas y zonas directamente
        this.listaTexturas = catalogos.texturas;
        this.listaZonas = catalogos.zonas;

        // ✅ ASIGNAR LISTAS YA FILTRADAS POR EL BACKEND
        // Ya no necesitamos filtrar en el frontend porque el backend lo hace
        this.listaNitrogeno = catalogos.nitrogeno; // Solo N > 9%
        this.listaFosforo = catalogos.fosforo; // Solo P2O5 > 5%
        this.listaPotasio = catalogos.potasio; // Solo K2O > 15% (SIN GUANO)
        this.listaEnmiendas = catalogos.enmiendas; // Solo CaO > 20% o ENMIENDA
      },
      error: (err) => {
        console.error('Error cargando catálogos', err);
        alert(
          'Error al cargar los datos maestros del servidor. Verifica la conexión.',
        );
      },
    });
  }

  async calcular() {
    if (this.formularioSuelo.valid) {
      const loading = await this.loadingCtrl.create({
        message: 'Calculando recomendación...',
        spinner: 'crescent',
      });
      await loading.present();
      const datos = this.formularioSuelo.value;
      // Convertir strings a números por si acaso (Ionic a veces devuelve strings en inputs)
      datos.areaHa = Number(datos.areaHa);
      datos.profundidadMetros = Number(datos.profundidadMetros);
      datos.materiaOrganica = Number(datos.materiaOrganica);
      datos.fosforoPpm = Number(datos.fosforoPpm);
      datos.potasioPpm = Number(datos.potasioPpm);
      datos.ph = Number(datos.ph);
      datos.ce = Number(datos.ce);
      datos.caIntercambiable = Number(datos.caIntercambiable);
      datos.mgIntercambiable = Number(datos.mgIntercambiable);
      datos.kIntercambiable = Number(datos.kIntercambiable);
      datos.naIntercambiable = Number(datos.naIntercambiable);
      datos.acidezIntercambiable = Number(datos.acidezIntercambiable);
      datos.b_ppm = Number(datos.b_ppm);
      datos.cu_ppm = Number(datos.cu_ppm);
      datos.zn_ppm = Number(datos.zn_ppm);
      datos.mn_ppm = Number(datos.mn_ppm);
      datos.fe_ppm = Number(datos.fe_ppm);
      datos.s_ppm = datos.s_ppm ? Number(datos.s_ppm) : null; // Azufre opcional
      datos.idFuenteN = Number(datos.idFuenteN);
      datos.idFuenteP = Number(datos.idFuenteP);
      datos.idFuenteK = Number(datos.idFuenteK);
      datos.idFuenteCa = Number(datos.idFuenteCa);
      datos.metaRendimiento = Number(datos.metaRendimiento);

      this.sueloService.calcularNutrientes(datos).subscribe({
        next: (res) => {
          this.resultado = res;
          // Limpiar cache cuando hay nuevo resultado
          this._nutrientesCascadaCache = null;
          this.pasoActual = 0;
          window.scrollTo(0, 0);
          loading.dismiss();
          setTimeout(() => {
            document.querySelector('ion-content')?.scrollToTop(500);
          }, 100);
        },
        error: (err) => {
          loading.dismiss();
          console.error('Error calculando', err);
          alert(
            'Error al conectar con el servidor. Revisa que el backend esté corriendo.',
          );
        },
      });
    } else {
      console.log('Formulario inválido');
    }
  }

  async guardarCalculo() {
    // Verificar autenticación con Firebase
    let isAuth = false;
    this.firebaseAuth.firebaseUser$.subscribe(user => isAuth = !!user).unsubscribe();

    if (!isAuth) {
      const alert = await this.alertController.create({
        header: 'Iniciar Sesión',
        message: 'Debes iniciar sesión para guardar el cálculo',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
          },
          {
            text: 'Ir a Login',
            handler: () => {
              this.router.navigate(['/phone-login']);
            }
          }
        ]
      });
      await alert.present();
      return;
    }

    // Cargar lista de chacras del usuario
    this.chacrasService.getChacras().subscribe({
      next: async (chacras) => {
        if (chacras.length === 0) {
          await this.showNoChacrasAlert();
        } else {
          await this.showSelectChacraAlert(chacras);
        }
      },
      error: (error) => {
        console.error('Error al cargar chacras:', error);
        this.showToast('Error al cargar las chacras', 'danger');
      },
    });
  }

  async showNoChacrasAlert() {
    const alert = await this.alertController.create({
      header: 'Sin Chacras',
      message: 'Primero debes crear una chacra en el dashboard',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Ir a Dashboard',
          handler: () => {
            this.router.navigate(['/dashboard']);
          },
        },
      ],
    });
    await alert.present();
  }

  async showSelectChacraAlert(chacras: Chacra[]) {
    const inputs = chacras.map((chacra) => ({
      type: 'radio' as const,
      label: `${chacra.nombre} (${chacra.areaHa} ha)`,
      value: chacra.id,
    }));

    const alert = await this.alertController.create({
      header: 'Seleccionar Chacra',
      message: 'Elige dónde guardar este análisis',
      inputs: inputs,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Guardar',
          handler: async (chacraId) => {
            if (chacraId) {
              await this.showNombreMuestraAlert(chacraId);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async showNombreMuestraAlert(chacraId: number) {
    const alert = await this.alertController.create({
      header: 'Nombre del Análisis',
      inputs: [
        {
          name: 'nombreMuestra',
          type: 'text',
          placeholder: 'Ej: Análisis Enero 2025',
          value: `Análisis ${new Date().toLocaleDateString('es-ES')}`,
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Guardar',
          handler: (data) => {
            this.saveCalculoToBackend(chacraId, data.nombreMuestra);
          },
        },
      ],
    });
    await alert.present();
  }

  saveCalculoToBackend(chacraId: number, nombreMuestra: string) {
    if (!this.resultado) return;

    this.guardando = true;
    const datos = this.formularioSuelo.value;

    this.sueloService.calcularYGuardar(chacraId, {
      nombreMuestra,
      datos
    }).subscribe({
      next: (response) => {
        this.guardando = false;
        this.showToast(`Guardado en ${response.chacraNombre}`, 'success');
      },
      error: (error) => {
        this.guardando = false;
        console.error('Error al guardar:', error);
        this.showToast('Error al guardar el cálculo', 'danger');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/phone-login']);
  }

  goToDashboard() {
    let isAuth = false;
    this.firebaseAuth.firebaseUser$.subscribe(user => isAuth = !!user).unsubscribe();

    if (isAuth) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/phone-login']);
    }
  }

  isAuthenticated(): boolean {
    let isAuth = false;
    this.firebaseAuth.firebaseUser$.subscribe(user => isAuth = !!user).unsubscribe();
    return isAuth;
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
    });
    toast.present();
  }

  // Método auxiliar para obtener el color de las alertas según severidad
  getColorSeveridad(severidad: string): string {
    switch (severidad) {
      case 'alta':
        return 'danger';
      case 'media':
        return 'warning';
      case 'baja':
        return 'success';
      default:
        return 'medium';
    }
  }

  // Método auxiliar para obtener las claves de un objeto (para iterar micronutrientes)
  getKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  // CASCADA VISUAL DINÁMICA: Genera la lista de nutrientes a mostrar
  getNutrientesCascada(): NutrienteCascada[] {
    // Si ya está en cache y el resultado no ha cambiado, devolver cache
    if (this._nutrientesCascadaCache && this.resultado) {
      return this._nutrientesCascadaCache;
    }

    if (!this.resultado?.recomendacion_fertilizacion) {
      return [];
    }

    const rec = this.resultado.recomendacion_fertilizacion;
    const nutrientes: NutrienteCascada[] = [];

    // 1️⃣ FÓSFORO (Se aplica primero en la cascada)
    nutrientes.push({
      numero: '1️⃣',
      key: 'Fosforo',
      nombre: 'Fósforo (P2O5)',
      data: rec.Fosforo,
      icon: '🔥',
      color: 'warning',
      tipo: 'primario',
    });

    // 2️⃣ POTASIO (Se calcula segundo)
    nutrientes.push({
      numero: '2️⃣',
      key: 'Potasio',
      nombre: 'Potasio (K2O)',
      data: rec.Potasio,
      icon: '🍌',
      color: 'tertiary',
      tipo: 'primario',
    });

    // 3️⃣ NITRÓGENO (Se calcula al final con descuentos)
    nutrientes.push({
      numero: '3️⃣',
      key: 'Nitrogeno',
      nombre: 'Nitrógeno (N)',
      data: rec.Nitrogeno,
      icon: '🍃',
      color: 'primary',
      tipo: 'primario',
    });

    // 4️⃣ MAGNESIO (Opcional - Solo si existe en la respuesta)
    if (rec.Magnesio && rec.Magnesio.cantidad_kg_ha > 0) {
      nutrientes.push({
        numero: '4️⃣',
        key: 'Magnesio',
        nombre: 'Magnesio (MgO)',
        data: rec.Magnesio,
        icon: '🟣',
        color: 'secondary',
        tipo: 'secundario',
        borderColor: '#9c27b0',
      });
    }

    // 5️⃣ AZUFRE (Opcional - Solo si existe en la respuesta)
    if (rec.Azufre && rec.Azufre.cantidad_kg_ha > 0) {
      nutrientes.push({
        numero: '5️⃣',
        key: 'Azufre',
        nombre: 'Azufre (S)',
        data: rec.Azufre,
        icon: '🟡',
        color: 'warning',
        tipo: 'secundario',
        borderColor: '#ffc107',
      });
    }

    // Guardar en cache
    this._nutrientesCascadaCache = nutrientes;
    return nutrientes;
  }

  editarDatos() {
    this.resultado = null;
    this.pasoActual = 1;
  }
}

// Interfaz para la Cascada Visual de Nutrientes
interface NutrienteCascada {
  numero: string;
  key: string;
  nombre: string;
  data: any;
  icon: string;
  color: string;
  tipo: 'primario' | 'secundario';
  borderColor?: string;
}
