import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  telefono?: string;
  activo: boolean;
}

export interface AuthResponse {
  token: string;  // El backend devuelve "token", no "access_token"
  user: Usuario;
}

export interface RegisterDto {
  email: string;
  password: string;
  nombre: string;
  telefono?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private http = inject(HttpClient);

  constructor() {
    // Inicializar el usuario desde el token existente sin hacer llamadas HTTP
    // El perfil se cargará manualmente cuando sea necesario (ej: en AppComponent.ngOnInit)
    const token = this.getToken();
    if (token) {
      console.log('🔍 Token encontrado en localStorage al inicializar AuthService');
    }
  }

  register(data: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.currentUserSubject.next(response.user);
        })
      );
  }

  login(data: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data)
      .pipe(
        tap(response => {
          console.log('🔐 Login response:', response);
          console.log('🔐 Token recibido:', response.token ? `${response.token.substring(0, 20)}...` : 'NO TOKEN');

          if (response.token) {
            this.setToken(response.token);
            const savedToken = this.getToken();
            console.log('✅ Token guardado:', savedToken ? `${savedToken.substring(0, 20)}...` : 'ERROR - NO SE GUARDÓ');
            this.currentUserSubject.next(response.user);
          } else {
            console.error('❌ No se recibió token en la respuesta');
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  getProfile(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/profile`);
  }

  loadProfile(): void {
    this.getProfile().subscribe({
      next: (user) => this.currentUserSubject.next(user),
      error: (err) => {
        console.warn('⚠️ No se pudo cargar el perfil del usuario:', err.message);
        // NO borrar el token aquí - solo si es un error de autenticación explícito
        if (err.status === 401) {
          console.log('🔐 Token inválido o expirado, cerrando sesión');
          this.logout();
        }
      }
    });
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    console.log('🔍 getToken called:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    return token;
  }

  setToken(token: string): void {
    console.log('💾 setToken called:', token ? `${token.substring(0, 20)}...` : 'EMPTY TOKEN');
    localStorage.setItem('token', token);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }
}
