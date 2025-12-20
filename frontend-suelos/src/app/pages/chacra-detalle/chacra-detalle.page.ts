import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, AlertController, ToastController, ModalController } from '@ionic/angular';
import { ChacrasService, Chacra, CalculoResumen, CalculoDetalle } from '../../services/chacras.service';

@Component({
  selector: 'app-chacra-detalle',
  templateUrl: './chacra-detalle.page.html',
  styleUrls: ['./chacra-detalle.page.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class ChacraDetallePage implements OnInit {
  chacraId!: number;
  chacra: Chacra | null = null;
  calculos: CalculoResumen[] = [];
  loading = true;
  selectedSegment = 'info';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chacrasService: ChacrasService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.chacraId = parseInt(id, 10);
      this.loadData();
    }
  }

  loadData() {
    this.loading = true;

    // Cargar datos de la chacra
    this.chacrasService.getChacra(this.chacraId).subscribe({
      next: (chacra) => {
        this.chacra = chacra;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar chacra:', error);
        this.showToast('Error al cargar la chacra', 'danger');
        this.router.navigate(['/dashboard']);
      }
    });

    // Cargar historial de cálculos
    this.loadCalculos();
  }

  loadCalculos() {
    this.chacrasService.getCalculos(this.chacraId).subscribe({
      next: (calculos) => {
        this.calculos = calculos;
      },
      error: (error) => {
        console.error('Error al cargar cálculos:', error);
      }
    });
  }

  async presentEditAlert() {
    if (!this.chacra) return;

    const alert = await this.alertController.create({
      header: 'Editar Chacra',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          value: this.chacra.nombre,
          placeholder: 'Nombre'
        },
        {
          name: 'areaHa',
          type: 'number',
          value: this.chacra.areaHa,
          placeholder: 'Área (ha)'
        },
        {
          name: 'ubicacion',
          type: 'text',
          value: this.chacra.ubicacion || '',
          placeholder: 'Ubicación'
        },
        {
          name: 'descripcion',
          type: 'textarea',
          value: this.chacra.descripcion || '',
          placeholder: 'Descripción'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: (data) => {
            this.updateChacra(data);
          }
        }
      ]
    });

    await alert.present();
  }

  updateChacra(data: any) {
    this.chacrasService.updateChacra(this.chacraId, {
      nombre: data.nombre,
      areaHa: parseFloat(data.areaHa),
      ubicacion: data.ubicacion || undefined,
      descripcion: data.descripcion || undefined
    }).subscribe({
      next: (chacra) => {
        this.chacra = chacra;
        this.showToast('Chacra actualizada', 'success');
      },
      error: (error) => {
        console.error('Error al actualizar:', error);
        this.showToast('Error al actualizar la chacra', 'danger');
      }
    });
  }

  goToCalculator() {
    // Navegar a calculadora y guardar el ID de chacra para guardado posterior
    localStorage.setItem('selectedChacraId', this.chacraId.toString());
    this.router.navigate(['/home']);
  }

  viewCalculoDetail(calculo: CalculoResumen) {
    this.chacrasService.getCalculo(this.chacraId, calculo.id).subscribe({
      next: async (detalle) => {
        await this.showCalculoDetailModal(detalle);
      },
      error: (error) => {
        console.error('Error al cargar detalle:', error);
        this.showToast('Error al cargar el detalle', 'danger');
      }
    });
  }

  async showCalculoDetailModal(calculo: CalculoDetalle) {
    const alert = await this.alertController.create({
      header: calculo.nombreMuestra,
      message: `
        <div style="text-align: left;">
          <p><strong>Fecha:</strong> ${new Date(calculo.fecha).toLocaleDateString('es-ES')}</p>
          <p><strong>pH:</strong> ${calculo.datosEntrada.ph}</p>
          <p><strong>Meta Rendimiento:</strong> ${calculo.datosEntrada.metaRendimiento} qq/ha</p>
          <p><strong>Textura:</strong> ${calculo.datosEntrada.textura}</p>
          <hr>
          <p><em>Ver calculadora para detalles completos</em></p>
        </div>
      `,
      buttons: ['Cerrar']
    });

    await alert.present();
  }

  getFormattedDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAlertColor(count?: number): string {
    if (!count) return 'success';
    if (count > 3) return 'danger';
    if (count > 1) return 'warning';
    return 'success';
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
}
