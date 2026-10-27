import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Sincroniza el usuario autenticado por Firebase Phone Auth en la tabla de Supabase
   */
  async ensureUserRegistered(
    firebaseUid: string,
    telefono?: string | null,
    nombre?: string | null,
    email?: string | null
  ): Promise<any> {
    const defaultName = nombre || telefono || 'Agricultor';
    const { data, error } = await this.supabase
      .from('usuarios')
      .upsert(
        {
          firebase_uid: firebaseUid,
          telefono: telefono || null,
          nombre: defaultName,
          email: email || null,
          activo: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'firebase_uid' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error al sincronizar usuario en Supabase:', error);
      throw error;
    }

    return data;
  }
}
