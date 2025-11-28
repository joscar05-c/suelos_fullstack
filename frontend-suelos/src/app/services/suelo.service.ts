import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SolicitudCalculo, RespuestaCalculo } from '../interfaces/suelo.interface';

@Injectable({
  providedIn: 'root'
})
export class SueloService {
  private http = inject(HttpClient);

  // Asegúrate de que esta URL coincida con tu backend local o VPS
  private apiUrl = 'http://localhost:3000/calculo-suelo/calcular-nutrientes';

  calcularNutrientes(datos: SolicitudCalculo): Observable<RespuestaCalculo> {
    return this.http.post<RespuestaCalculo>(this.apiUrl, datos);
  }
}
