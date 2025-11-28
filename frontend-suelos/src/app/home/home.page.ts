import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonButton, IonList
} from '@ionic/angular/standalone';
import { SueloService } from '../services/suelo.service';
import { RespuestaCalculo } from '../interfaces/suelo.interface';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
    IonButton, IonList
  ],
})
export class HomePage {
  private fb = inject(FormBuilder);
  private sueloService = inject(SueloService);

  formularioSuelo: FormGroup;
  resultado: RespuestaCalculo | null = null;

  // Listas idénticas a la Base de Datos
  listaTexturas = [
    { id: 1, nombre: 'Arenoso' },
    { id: 2, nombre: 'Franco Arenoso' },
    { id: 3, nombre: 'Franco' },
    { id: 4, nombre: 'Franco Arcilloso' },
    { id: 5, nombre: 'Arcilloso' }
  ];

  listaZonas = [
    { id: 1, zona: 'Costa' },
    { id: 2, zona: 'Sierra > 4000 msnm' },
    { id: 3, zona: 'Sierra < 4000 msnm' },
    { id: 4, zona: 'Selva > 600 msnm' },
    { id: 5, zona: 'Selva < 600 msnm' }
  ];

  constructor() {
    // Valores por defecto del ejercicio de la Foto para probar rápido
    this.formularioSuelo = this.fb.group({
      areaHa: [1, [Validators.required, Validators.min(0)]],
      profundidadMetros: [0.15, [Validators.required, Validators.min(0)]],
      idTextura: [4, [Validators.required]], // Franco Arcilloso
      materiaOrganica: [3.0, [Validators.required]],
      fosforoPpm: [10.5, [Validators.required]],
      potasioPpm: [210, [Validators.required]],
      idZona: [4, [Validators.required]] // Selva Alta
    });
  }

  calcular() {
    if (this.formularioSuelo.valid) {
      const datos = this.formularioSuelo.value;
      // Convertir strings a números por si acaso (Ionic a veces devuelve strings en inputs)
      datos.areaHa = Number(datos.areaHa);
      datos.profundidadMetros = Number(datos.profundidadMetros);
      datos.materiaOrganica = Number(datos.materiaOrganica);
      datos.fosforoPpm = Number(datos.fosforoPpm);
      datos.potasioPpm = Number(datos.potasioPpm);

      this.sueloService.calcularNutrientes(datos).subscribe({
        next: (res) => {
          this.resultado = res;
        },
        error: (err) => {
          console.error('Error calculando', err);
          alert('Error al conectar con el servidor. Revisa que el backend esté corriendo.');
        }
      });
    }
  }
}
