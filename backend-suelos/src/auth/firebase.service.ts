import * as admin from 'firebase-admin';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FirebaseService {
  constructor() {
    this.initFirebase();
  }

  private initFirebase() {
    if (!admin.apps.length) {
      // Verificar si las variables de entorno están configuradas
      if (process.env.FIREBASE_PROJECT_ID) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
        console.log('🔥 Firebase Admin SDK inicializado con variables de entorno');
      } else {
        // Fallback a archivo JSON si existe
        try {
          const serviceAccount = require('../../firebase-service-account.json');
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          console.log('🔥 Firebase Admin SDK inicializado con service account JSON');
        } catch (error) {
          console.error('❌ No se pudo inicializar Firebase Admin SDK. Configura las variables de entorno o el archivo JSON');
        }
      }
    }
  }

  async verifyIdToken(token: string) {
    return admin.auth().verifyIdToken(token);
  }

  async getUser(uid: string) {
    return admin.auth().getUser(uid);
  }
}