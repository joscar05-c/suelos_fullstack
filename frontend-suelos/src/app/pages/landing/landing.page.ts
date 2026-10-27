import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { addIcons } from 'ionicons';
import {
  leafOutline,
  calculatorOutline,
  cloudOfflineOutline,
  shieldCheckmarkOutline,
  flashOutline,
  layersOutline,
  sparklesOutline,
  arrowForwardOutline,
  checkmarkCircleOutline,
  personOutline,
  calendarOutline,
  cubeOutline,
  logInOutline,
  folderOutline,
  statsChartOutline,
  speedometerOutline,
  checkmarkOutline,
  phonePortraitOutline,
} from 'ionicons/icons';
import { FirebaseAuthService } from '../../services/firebase-auth.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class LandingPage implements OnInit {
  private authService = inject(FirebaseAuthService);
  private router = inject(Router);

  isAuth = false;
  usuarioNombre: string = '';

  constructor() {
    addIcons({
      leafOutline,
      calculatorOutline,
      cloudOfflineOutline,
      shieldCheckmarkOutline,
      flashOutline,
      layersOutline,
      sparklesOutline,
      arrowForwardOutline,
      checkmarkCircleOutline,
      personOutline,
      calendarOutline,
      cubeOutline,
      logInOutline,
      folderOutline,
      statsChartOutline,
      speedometerOutline,
      checkmarkOutline,
      phonePortraitOutline,
    });
  }

  ngOnInit() {
    // 📱 DETECCIÓN AUTOMÁTICA DE APLICACIÓN MÓVIL NATIVA (APK Android / iOS)
    // Cuando el usuario instala y abre la app móvil desde su teléfono,
    // NO debe ver la landing de marketing web, sino el Onboarding o la Calculadora directa.
    if (Capacitor.isNativePlatform()) {
      const yaVioOnboarding = localStorage.getItem('onboarding_visto');
      if (!yaVioOnboarding) {
        this.router.navigate(['/onboarding'], { replaceUrl: true });
        return;
      } else {
        this.router.navigate(['/home'], { replaceUrl: true });
        return;
      }
    }

    this.authService.firebaseUser$.subscribe((user) => {
      this.isAuth = !!user;
    });

    this.authService.appUser$.subscribe((appUser) => {
      if (appUser?.nombre) {
        this.usuarioNombre = appUser.nombre;
      }
    });
  }

  irACalculadora() {
    this.router.navigate(['/home']);
  }

  irADashboard() {
    if (this.isAuth) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/phone-login']);
    }
  }

  irALogin() {
    this.router.navigate(['/phone-login']);
  }

  verOnboarding() {
    this.router.navigate(['/onboarding']);
  }

  irAPrivacidad() {
    this.router.navigate(['/privacidad']);
  }
}
