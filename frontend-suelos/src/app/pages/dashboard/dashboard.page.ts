import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import {
  FirebaseAuthService,
  Usuario,
} from '../../services/firebase-auth.service';
import { ChacrasService, Chacra } from '../../services/chacras.service';
import { addIcons } from 'ionicons';
import {
  logOutOutline,
  personCircle,
  addCircle,
  calculator,
  leafOutline,
  location,
  mapOutline,
  documentText,
  trash,
} from 'ionicons/icons';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class DashboardPage implements OnInit {
  usuario: Usuario | null = null;
  chacras: Chacra[] = [];
  loading = true;

  constructor(
    private firebaseAuth: FirebaseAuthService,
    private chacrasService: ChacrasService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
  ) {
    // Registrar iconos usados en el template
    addIcons({
      logOutOutline,
      personCircle,
      addCircle,
      calculator,
      leafOutline,
      location,
      mapOutline,
      documentText,
      trash,
    });
  }

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    this.loading = true;

    // Suscribirse a los datos del usuario de la app
    this.firebaseAuth.appUser$.subscribe({
      next: (user) => {
        this.usuario = user;
      },
    });

    this.chacrasService.getChacras().subscribe({
      next: (chacras) => {
        this.chacras = chacras;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar chacras:', error);
        this.loading = false;
        this.showToast('Error al cargar las chacras', 'danger');
      },
    });
  }

  async presentAddChacraAlert() {
    const alert = await this.alertController.create({
      header: 'Nueva Parcela', // O Chacra, según prefieras
      subHeader: 'Ingresa los datos del terreno',
      cssClass: 'alerta-formulario-suelos', // <-- Clase personalizada
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          placeholder: 'Nombre (ej. Lote Norte)',
        },
        { name: 'areaHa', type: 'number', placeholder: 'Área (Hectáreas)' },
        { name: 'ubicacion', type: 'text', placeholder: 'Ubicación' },
        {
          name: 'descripcion',
          type: 'textarea',
          placeholder: 'Notas adicionales',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'boton-cancelar' },
        {
          text: 'Crear',
          handler: (data) => {
            // Validamos que el nombre no esté vacío y que el área sea un número válido mayor a 0
            const area = parseFloat(data.areaHa);
            if (data.nombre?.trim() && !isNaN(area) && area > 0) {
              this.createChacra(data);
              return true; // Cierra el alert
            } else {
              this.showToast(
                'Nombre y área (mayor a 0) son obligatorios',
                'warning',
              );
              return false; // Mantiene el alert abierto para que el usuario corrija
            }
          },
        },
      ],
    });
    await alert.present();
  }

  createChacra(data: any) {
    this.chacrasService
      .createChacra({
        nombre: data.nombre,
        areaHa: parseFloat(data.areaHa),
        ubicacion: data.ubicacion || undefined,
        descripcion: data.descripcion || undefined,
      })
      .subscribe({
        next: () => {
          this.showToast('Chacra creada exitosamente', 'success');
          this.loadData();
        },
        error: (error) => {
          console.error('Error al crear chacra:', error);
          this.showToast('Error al crear la chacra', 'danger');
        },
      });
  }

  goToChacraDetail(chacra: Chacra) {
    this.router.navigate(['/chacra-detalle', chacra.id]);
  }

  goToCalculator() {
    this.router.navigate(['/home']);
  }

  async confirmDelete(chacra: Chacra, event: Event) {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Eliminar Terreno',
      message: `¿Estás seguro de eliminar <strong>"${chacra.nombre}"</strong>? Esta acción no se puede deshacer.`,
      cssClass: 'alerta-confirmacion-suelos', // <-- Clase personalizada
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteChacra(chacra.id);
          },
        },
      ],
    });
    await alert.present();
  }

  deleteChacra(id: number) {
    this.chacrasService.deleteChacra(id).subscribe({
      next: () => {
        this.showToast('Chacra eliminada', 'success');
        this.loadData();
      },
      error: (error) => {
        console.error('Error al eliminar chacra:', error);
        this.showToast('Error al eliminar la chacra', 'danger');
      },
    });
  }

  async logout() {
    await this.firebaseAuth.logout();
    this.router.navigate(['/phone-login'], { replaceUrl: true });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
      cssClass: 'toast-suelos', // <-- Clase personalizada
    });
    toast.present();
  }

  getFormattedDate(dateString?: string): string {
    if (!dateString) return 'Sin cálculos';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
