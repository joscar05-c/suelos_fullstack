#!/usr/bin/env node

/**
 * Script para ayudar con la configuración de Firebase
 * Uso: node firebase-config-helper.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔥 Asistente de Configuración Firebase\n');
console.log('Este script te ayudará a configurar Firebase en tu proyecto.\n');

const questions = [
  {
    key: 'apiKey',
    question: 'Ingresa tu Firebase API Key: '
  },
  {
    key: 'authDomain', 
    question: 'Ingresa tu Auth Domain (ej: tu-proyecto.firebaseapp.com): '
  },
  {
    key: 'projectId',
    question: 'Ingresa tu Project ID: '
  },
  {
    key: 'storageBucket',
    question: 'Ingresa tu Storage Bucket (ej: tu-proyecto.appspot.com): '
  },
  {
    key: 'messagingSenderId',
    question: 'Ingresa tu Messaging Sender ID: '
  },
  {
    key: 'appId',
    question: 'Ingresa tu App ID: '
  }
];

const answers = {};
let currentQuestion = 0;

function askQuestion() {
  if (currentQuestion < questions.length) {
    const q = questions[currentQuestion];
    rl.question(q.question, (answer) => {
      answers[q.key] = answer.trim();
      currentQuestion++;
      askQuestion();
    });
  } else {
    generateConfig();
  }
}

function generateConfig() {
  console.log('\n📝 Generando configuración...\n');

  const configTemplate = `import { Injectable } from '@angular/core';
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

const firebaseConfig = {
  apiKey: "${answers.apiKey}",
  authDomain: "${answers.authDomain}",
  projectId: "${answers.projectId}",
  storageBucket: "${answers.storageBucket}",
  messagingSenderId: "${answers.messagingSenderId}",
  appId: "${answers.appId}"
};

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private app = initializeApp(firebaseConfig);
  private auth = getAuth(this.app);
  private apiUrl = \`\${environment.apiUrl}/auth\`;
  
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
   * Inicializar ReCAPTCHA para verificación de teléfono
   */
  initRecaptcha(elementId: string) {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
    }
    
    this.recaptchaVerifier = new RecaptchaVerifier(this.auth, elementId, {
      size: 'invisible',
      callback: () => {
        console.log('✅ ReCAPTCHA resuelto');
      },
      'expired-callback': () => {
        console.log('⚠️ ReCAPTCHA expirado');
      }
    });
  }

  /**
   * Enviar código SMS al número de teléfono
   */
  async sendSMS(phoneNumber: string): Promise<boolean> {
    try {
      if (!this.recaptchaVerifier) {
        throw new Error('ReCAPTCHA no inicializado');
      }

      // Formato internacional del teléfono (ej: +57 300 123 4567)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : \`+57\${phoneNumber}\`;
      
      console.log('📱 Enviando SMS a:', formattedPhone);
      
      this.confirmationResult = await signInWithPhoneNumber(
        this.auth, 
        formattedPhone, 
        this.recaptchaVerifier
      );
      
      console.log('✅ SMS enviado correctamente');
      return true;
    } catch (error: any) {
      console.error('❌ Error al enviar SMS:', error);
      throw new Error(\`Error al enviar SMS: \${error.message}\`);
    }
  }

  /**
   * Verificar código SMS y completar autenticación
   */
  async verifyCode(code: string): Promise<boolean> {
    try {
      if (!this.confirmationResult) {
        throw new Error('No hay confirmación pendiente');
      }

      console.log('🔍 Verificando código:', code);
      
      const result = await this.confirmationResult.confirm(code);
      const user = result.user;
      
      console.log('✅ Código verificado, usuario autenticado:', user.uid);
      return true;
    } catch (error: any) {
      console.error('❌ Error al verificar código:', error);
      throw new Error(\`Código incorrecto: \${error.message}\`);
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
      
      const response = await fetch(\`\${this.apiUrl}/profile\`, {
        headers: {
          'Authorization': \`Bearer \${token}\`,
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
    await this.auth.signOut();
    console.log('👋 Sesión cerrada');
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
}`;

  // Guardar configuración
  const frontendPath = path.join(__dirname, 'frontend-suelos', 'src', 'app', 'services', 'firebase-auth.service.ts');
  
  try {
    fs.writeFileSync(frontendPath, configTemplate);
    console.log('✅ Configuración guardada en:', frontendPath);
    
    console.log('\n🎯 Configuración de Frontend COMPLETA!');
    console.log('\nPróximos pasos:');
    console.log('1. Configura el Backend con las credenciales del Service Account');
    console.log('2. Ejecuta el backend: cd backend-suelos && npm run start:dev');
    console.log('3. Ejecuta el frontend: cd frontend-suelos && ionic serve');
    
  } catch (error) {
    console.error('❌ Error al guardar:', error.message);
  }
  
  rl.close();
}

console.log('Sigue las instrucciones en GUIA-FIREBASE-SETUP.md para obtener estos datos.\n');
askQuestion();