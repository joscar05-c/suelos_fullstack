import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  leafOutline,
  cloudOfflineOutline,
  cubeOutline,
  arrowForwardOutline,
  checkmarkOutline,
  sparklesOutline,
  chevronForwardOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class OnboardingPage {
  private router = inject(Router);

  pasoActual = 1;

  pasos = [
    {
      numero: 1,
      etiqueta: 'BIENVENIDO A AGROSUELOS',
      titulo: 'Diagnóstico Agronómico Certificado',
      descripcion:
        'Interpreta tus análisis de laboratorio al instante y calcula el balance nutricional óptimo para Café, Cacao y tus cultivos basado en metodologías UNALM y JNC/INIA.',
      icono: 'leaf-outline',
      colorIcono: 'text-hoja',
      fondoIcono: 'bg-green-100',
    },
    {
      numero: 2,
      etiqueta: 'TECNOLOGÍA EN EL CAMPO',
      titulo: 'Funciona 100% Sin Conexión',
      descripcion:
        'Llévala a parcelas remotas en la selva o sierra. La base de datos y el motor de cálculo funcionan en tu celular sin requerir señal celular ni internet.',
      icono: 'cloud-offline-outline',
      colorIcono: 'text-amber-600',
      fondoIcono: 'bg-amber-100',
    },
    {
      numero: 3,
      etiqueta: 'DOSIFICACIÓN EXACTA',
      titulo: 'Dosis en Sacos y por Planta',
      descripcion:
        'Evita sobredosis y desperdicio de dinero. Obtén el número exacto de sacos de 50 kg comerciales a comprar y los gramos por cada planta fraccionados por etapa fenológica.',
      icono: 'cube-outline',
      colorIcono: 'text-blue-600',
      fondoIcono: 'bg-blue-100',
    },
  ];

  constructor() {
    addIcons({
      leafOutline,
      cloudOfflineOutline,
      cubeOutline,
      arrowForwardOutline,
      checkmarkOutline,
      sparklesOutline,
      chevronForwardOutline,
    });
  }

  siguiente() {
    if (this.pasoActual < 3) {
      this.pasoActual++;
    } else {
      this.finalizarOnboarding();
    }
  }

  saltar() {
    this.finalizarOnboarding();
  }

  finalizarOnboarding() {
    try {
      localStorage.setItem('onboarding_visto', 'true');
    } catch (_) {}
    this.router.navigate(['/home'], { replaceUrl: true });
  }
}
