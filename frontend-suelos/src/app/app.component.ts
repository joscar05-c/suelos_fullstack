import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);

  constructor() {}

  ngOnInit() {
    // Cargar el perfil del usuario si hay un token válido
    // Esto se hace aquí para evitar la dependencia circular en el constructor de AuthService
    if (this.authService.isAuthenticated()) {
      this.authService.loadProfile();
    }
  }
}
