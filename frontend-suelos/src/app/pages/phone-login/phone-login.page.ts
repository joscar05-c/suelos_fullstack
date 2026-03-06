import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseAuthService } from '../../services/firebase-auth.service';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { leaf, phonePortrait, chatboxEllipses, checkmarkCircle } from 'ionicons/icons';

@Component({
  selector: 'app-phone-login',
  templateUrl: './phone-login.page.html',
  styleUrls: ['./phone-login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PhoneLoginPage implements OnInit, OnDestroy {
  step: 'phone' | 'verify' = 'phone';
  phoneNumber = '';
  verificationCode = '';
  loading = false;
  countdown = 0;

  private countdownInterval?: any;
  private authSubscription?: Subscription;

  constructor(
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private firebaseAuth: FirebaseAuthService
  ) {
    // Registrar iconos usados en el template
    addIcons({ leaf, phonePortrait, chatboxEllipses, checkmarkCircle });

    // Asegurar inicialización correcta
    this.phoneNumber = this.phoneNumber || '';
    this.verificationCode = this.verificationCode || '';
  }

  ngOnInit() {
    // Verificar si ya está autenticado
    this.authSubscription = this.firebaseAuth.firebaseUser$.subscribe(user => {
      if (user) {
        console.log('✅ Usuario ya autenticado, redirigiendo...');
        this.router.navigate(['/dashboard'], { replaceUrl: true });
      }
    });

    // Configurar ReCAPTCHA siguiendo mejores prácticas
    // Se hace después de que la vista esté lista
    setTimeout(() => {
      const success = this.firebaseAuth.setupRecaptcha('recaptcha-container');
      if (!success) {
        console.error('❌ No se pudo configurar ReCAPTCHA');
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.authSubscription?.unsubscribe();
  }

  isPhoneValid(): boolean {
    if (!this.phoneNumber || typeof this.phoneNumber !== 'string') {
      return false;
    }
    return this.phoneNumber.length === 9 && /^[0-9]+$/.test(this.phoneNumber);
  }

  isCodeValid(): boolean {
    console.log('🔍 Validando código:', {
      verificationCode: this.verificationCode,
      type: typeof this.verificationCode,
      length: this.verificationCode?.length,
      isString: typeof this.verificationCode === 'string',
      passes6digits: this.verificationCode?.length === 6,
      passesRegex: this.verificationCode ? /^[0-9]+$/.test(this.verificationCode) : false
    });

    if (!this.verificationCode || typeof this.verificationCode !== 'string') {
      console.log('❌ Código inválido: no es string o está vacío');
      return false;
    }
    const isValid = this.verificationCode.length === 6 && /^[0-9]+$/.test(this.verificationCode);
    console.log('✅ Validación final:', isValid);
    return isValid;
  }

  onCodeInput(event: any) {
    console.log('📝 Input cambiado:', event.target.value);
    this.verificationCode = event.target.value || '';
    console.log('📝 Código actualizado:', this.verificationCode);
  }

  async sendCode() {
    if (!this.isPhoneValid()) {
      this.showAlert('Error', 'Ingresa un número de teléfono válido de 9 dígitos');
      return;
    }

    this.loading = true;

    try {
      await this.firebaseAuth.sendSMS(this.phoneNumber);
      this.step = 'verify';
      this.startCountdown();
      this.showAlert('Código Enviado', `Se ha enviado un código de verificación al +51 ${this.phoneNumber}`);
    } catch (error: any) {
      console.error('Error al enviar SMS:', error);
      this.showAlert('Error', error.message || 'No se pudo enviar el código. Intenta nuevamente.');
    } finally {
      this.loading = false;
    }
  }

  async verifyCode() {
    if (!this.isCodeValid()) {
      this.showAlert('Error', 'Ingresa un código de 6 dígitos');
      return;
    }

    this.loading = true;

    try {
      const success = await this.firebaseAuth.verifyCode(this.verificationCode);

      if (success) {
        // El AuthService se encarga de la redirección automática
        console.log('✅ Verificación exitosa');
      }
    } catch (error: any) {
      console.error('Error al verificar código:', error);
      this.showAlert('Error', 'Código incorrecto. Verifica e intenta nuevamente.');
    } finally {
      this.loading = false;
    }
  }

  goBackToPhone() {
    this.step = 'phone';
    this.verificationCode = '';
    this.loading = false;
    this.stopCountdown();
  }

  async resendCode() {
    this.verificationCode = '';
    this.loading = false;
    await this.sendCode();
  }

  private startCountdown() {
    this.countdown = 60;
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.stopCountdown();
      }
    }, 1000);
  }

  private stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.countdown = 0;
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
