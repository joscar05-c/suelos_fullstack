import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ChacrasService, CalculoDetalle } from '../../services/chacras.service';
import { PdfExportService } from '../../services/pdf-export.service';
import { addIcons } from 'ionicons';
import { arrowBack, download, checkmarkCircle, alertCircle } from 'ionicons/icons';

@Component({
  selector: 'app-calculo-detalle',
  templateUrl: './calculo-detalle.page.html',
  styleUrls: ['./calculo-detalle.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class CalculoDetallePage implements OnInit {
  chacraId!: number;
  calculoId!: number;
  calculo: CalculoDetalle | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chacrasService: ChacrasService,
    private pdfExportService: PdfExportService,
    private toastController: ToastController
  ) {
    addIcons({ arrowBack, download, checkmarkCircle, alertCircle });
  }

  ngOnInit() {
    const chacraId = this.route.snapshot.paramMap.get('chacraId');
    const calculoId = this.route.snapshot.paramMap.get('calculoId');

    if (chacraId && calculoId) {
      this.chacraId = parseInt(chacraId, 10);
      this.calculoId = parseInt(calculoId, 10);
      setTimeout(() => this.loadCalculo(), 0);
    } else {
      this.loading = false;
      this.router.navigate(['/dashboard']);
    }
  }

  loadCalculo() {
    this.loading = true;
    this.chacrasService.getCalculo(this.chacraId, this.calculoId).subscribe({
      next: (calculo) => {
        this.calculo = calculo;
        setTimeout(() => this.loading = false, 100);
      },
      error: (error) => {
        console.error('Error al cargar cálculo:', error);
        this.showToast('Error al cargar el cálculo', 'danger');
        this.router.navigate(['/chacra-detalle', this.chacraId]);
      }
    });
  }

  async exportarPDF() {
    if (!this.calculo) return;

    try {
      this.pdfExportService.generarReporteSuelo(this.calculo);
      this.showToast('PDF exportado exitosamente', 'success');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      this.showToast('Error al exportar PDF', 'danger');
    }
  }

  goBack() {
    this.router.navigate(['/chacra-detalle', this.chacraId]);
  }

  getKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

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
