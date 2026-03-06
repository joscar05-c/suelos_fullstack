import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Usuario {
  id: number;
  firebaseUid: string;
  telefono?: string;
  email?: string;
  nombre?: string;
  activo: boolean;
}

const firebaseConfig = environment.firebase;

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private app = initializeApp(firebaseConfig);
  private auth = getAuth(this.app);
  private apiUrl = `${environment.apiUrl}/auth`;

  private firebaseUserSubject = new BehaviorSubject<User | null>(null);
  private appUserSubject = new BehaviorSubject<Usuario | null>(null);

  public firebaseUser$ = this.firebaseUserSubject.asObservable();
  public appUser$ = this.appUserSubject.asObservable();

  private recaptchaVerifier?: RecaptchaVerifier;
  private confirmationResult?: ConfirmationResult;

  constructor(private http: HttpClient) {
    // Escuchar cambios en el estado de autenticación de Firebase
    onAuthStateChanged(this.auth, async (user) => {
      console.log('🔥 Firebase auth state changed:', user?.uid);
      this.firebaseUserSubject.next(user);

      if (user) {
        // Usuario autenticado, obtener datos de nuestra API
        await this.loadUserProfile();
      } else {
        // Usuario no autenticado
        this.appUserSubject.next(null);
      }
    });
  }

  /**
   * Configurar ReCAPTCHA siguiendo las mejores prácticas de Firebase
   * Debe llamarse antes de enviar SMS
   */
  setupRecaptcha(elementId: string = 'recaptcha-container') {
    try {
      // Limpiar verificador anterior si existe
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = undefined;
      }

      // Verificar que el elemento existe
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`❌ Elemento ${elementId} no encontrado para ReCAPTCHA`);
        return false;
      }

      console.log('🔐 Configurando ReCAPTCHA...');

      // Crear ReCAPTCHA usando window como recomienda Firebase
      (window as any).recaptchaVerifier = new RecaptchaVerifier(this.auth, elementId, {
        size: 'invisible', // Invisible para mejor UX
        callback: (response: any) => {
          console.log('✅ ReCAPTCHA resuelto');
        },
        'expired-callback': () => {
          console.log('⚠️ ReCAPTCHA expirado, necesita renovarse');
          // Limpiar en caso de expiración
          this.clearRecaptcha();
        }
      });

      console.log('✅ ReCAPTCHA configurado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error al configurar ReCAPTCHA:', error);
      return false;
    }
  }

  /**
   * Limpiar ReCAPTCHA para reiniciar verificación
   */
  private clearRecaptcha() {
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch (error) {
        console.error('Error al limpiar ReCAPTCHA:', error);
      }
      (window as any).recaptchaVerifier = undefined;
    }
    (window as any).confirmationResult = undefined;
  }

  /**
   * Método público para inicializar ReCAPTCHA (mantener compatibilidad)
   */
  initRecaptcha(elementId: string) {
    return this.setupRecaptcha(elementId);
  }

  /**
   * Enviar código SMS al número de teléfono
   * Sigue el orden estricto recomendado por Firebase
   */
  async sendSMS(phoneNumber: string): Promise<boolean> {
    try {
      // Verificar que ReCAPTCHA esté configurado
      const appVerifier = (window as any).recaptchaVerifier;
      if (!appVerifier) {
        throw new Error('ReCAPTCHA no configurado. Llama a setupRecaptcha() primero.');
      }

      // Formato internacional del teléfono (ej: +51 900 123 456)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+51${phoneNumber}`;
      console.log('📱 Enviando SMS a:', formattedPhone);

      // Enviar SMS usando el verificador
      const confirmationResult = await signInWithPhoneNumber(
        this.auth,
        formattedPhone,
        appVerifier
      );

      // Guardar resultado en window para usarlo al verificar el código
      (window as any).confirmationResult = confirmationResult;
      this.confirmationResult = confirmationResult;

      console.log('✅ SMS enviado correctamente');
      return true;
    } catch (error: any) {
      console.error('❌ Error al enviar SMS:', error);

      // Limpiar ReCAPTCHA en caso de error para permitir reintentos
      this.clearRecaptcha();

      // Mensajes de error más específicos
      let errorMessage = 'Error desconocido al enviar SMS';

      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-app-credential':
            errorMessage = 'Error de configuración de Firebase. Revisa las credenciales de la aplicación.';
            break;
          case 'auth/captcha-check-failed':
            errorMessage = 'Error en la verificación CAPTCHA. Intenta nuevamente.';
            break;
          case 'auth/invalid-phone-number':
            errorMessage = 'Número de teléfono inválido. Verifica el formato.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Demasiadas solicitudes. Espera unos minutos e intenta nuevamente.';
            break;
          case 'auth/billing-not-enabled':
            errorMessage = 'La facturación no está habilitada en Firebase. Activa la facturación en Google Cloud.';
            break;
          default:
            errorMessage = `Error: ${error.message || error.code}`;
        }
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Verificar código SMS y completar autenticación
   */
  async verifyCode(code: string): Promise<boolean> {
    try {
      // Usar confirmationResult desde window (patrón recomendado)
      const confirmationResult = (window as any).confirmationResult || this.confirmationResult;

      if (!confirmationResult) {
        throw new Error('No hay confirmación pendiente. Envía el SMS primero.');
      }

      console.log('🔍 Verificando código:', code);

      const result = await confirmationResult.confirm(code);
      const user = result.user;

      console.log('✅ Código verificado, usuario autenticado:', user.uid);

      // Limpiar datos de verificación después del éxito
      (window as any).confirmationResult = undefined;
      this.confirmationResult = undefined;

      return true;
    } catch (error: any) {
      console.error('❌ Error al verificar código:', error);
      throw new Error(`Código incorrecto: ${error.message}`);
    }
  }

  /**
   * Cargar perfil del usuario desde nuestra API
   */
  private async loadUserProfile() {
    try {
      const user = this.auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();

      const response = await fetch(`${this.apiUrl}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        this.appUserSubject.next(userData);
        console.log('✅ Perfil cargado:', userData);
      } else {
        console.error('❌ Error al cargar perfil:', response.status);
      }
    } catch (error) {
      console.error('❌ Error al cargar perfil:', error);
    }
  }

  /**
   * Obtener token de Firebase del usuario actual
   */
  async getIdToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    // Limpiar ReCAPTCHA al cerrar sesión
    this.clearRecaptcha();

    await this.auth.signOut();
    console.log('👋 Sesión cerrada');
  }

  /**
   * Reconfigurar ReCAPTCHA (útil para reintentos)
   */
  resetRecaptcha(): boolean {
    this.clearRecaptcha();
    return this.setupRecaptcha('recaptcha-container');
  }

  /**
   * Verificar si ReCAPTCHA está configurado
   */
  isRecaptchaReady(): boolean {
    return !!(window as any).recaptchaVerifier;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  get isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }

  /**
   * Obtener usuario actual de Firebase
   */
  get currentFirebaseUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Obtener datos del usuario de la app
   */
  get currentAppUser(): Usuario | null {
    return this.appUserSubject.value;
  }
}
