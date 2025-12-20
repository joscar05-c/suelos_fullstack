import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { AuthService, Usuario } from '../../services/auth.service';
import { ChacrasService, Chacra } from '../../services/chacras.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class DashboardPage implements OnInit {
  usuario: Usuario | null = null;
  chacras: Chacra[] = [];
  loading = true;

  constructor(
    private authService: AuthService,
    private chacrasService: ChacrasService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.usuario = this.authService.getCurrentUser();

    this.chacrasService.getChacras().subscribe({
      next: (chacras) => {
        this.chacras = chacras;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar chacras:', error);
        this.loading = false;
        this.showToast('Error al cargar las chacras', 'danger');
      }
    });
  }

  async presentAddChacraAlert() {
    const alert = await this.alertController.create({
      header: 'Nueva Chacra',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          placeholder: 'Nombre de la chacra',
          attributes: {
            minlength: 3,
            maxlength: 100
          }
        },
        {
          name: 'areaHa',
          type: 'number',
          placeholder: 'Área (hectáreas)',
          min: 0.1,
          max: 10000
        },
        {
          name: 'ubicacion',
          type: 'text',
          placeholder: 'Ubicación (opcional)'
        },
        {
          name: 'descripcion',
          type: 'textarea',
          placeholder: 'Descripción (opcional)'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Crear',
          handler: (data) => {
            if (data.nombre && data.areaHa) {
              this.createChacra(data);
            } else {
              this.showToast('Nombre y área son obligatorios', 'warning');
              return false;
            }
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  createChacra(data: any) {
    this.chacrasService.createChacra({
      nombre: data.nombre,
      areaHa: parseFloat(data.areaHa),
      ubicacion: data.ubicacion || undefined,
      descripcion: data.descripcion || undefined
    }).subscribe({
      next: () => {
        this.showToast('Chacra creada exitosamente', 'success');
        this.loadData();
      },
      error: (error) => {
        console.error('Error al crear chacra:', error);
        this.showToast('Error al crear la chacra', 'danger');
      }
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
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de eliminar "${chacra.nombre}"? Se eliminarán todos los cálculos asociados.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteChacra(chacra.id);
          }
        }
      ]
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
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });
    toast.present();
  }

  getFormattedDate(dateString?: string): string {
    if (!dateString) return 'Sin cálculos';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
