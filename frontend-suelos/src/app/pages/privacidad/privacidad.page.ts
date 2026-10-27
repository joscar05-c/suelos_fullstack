import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  shieldCheckmarkOutline,
  lockClosedOutline,
  cloudOfflineOutline,
  serverOutline,
  trashOutline,
  mailOutline,
  documentTextOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-privacidad',
  templateUrl: './privacidad.page.html',
  styleUrls: ['./privacidad.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class PrivacidadPage {
  private router = inject(Router);

  fechaActualizacion = '27 de Octubre de 2026';

  constructor() {
    addIcons({
      arrowBackOutline,
      shieldCheckmarkOutline,
      lockClosedOutline,
      cloudOfflineOutline,
      serverOutline,
      trashOutline,
      mailOutline,
      documentTextOutline,
      checkmarkCircleOutline,
    });
  }

  volver() {
    this.router.navigate(['/']);
  }
}
