import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
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
  private router = inject(FirebaseAuthService);
  private authService = inject(FirebaseAuthService);
  private ngRouter = inject(Router);

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
    });
  }

  ngOnInit() {
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
    this.ngRouter.navigate(['/home']);
  }

  irADashboard() {
    if (this.isAuth) {
      this.ngRouter.navigate(['/dashboard']);
    } else {
      this.ngRouter.navigate(['/phone-login']);
    }
  }

  irALogin() {
    this.ngRouter.navigate(['/phone-login']);
  }
}
