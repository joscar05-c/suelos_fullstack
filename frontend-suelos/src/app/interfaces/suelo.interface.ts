export interface SolicitudCalculo {
  areaHa: number;
  profundidadMetros: number;
  idTextura: number;
  materiaOrganica: number;
  fosforoPpm: number;
  potasioPpm: number;
  idZona: number;
}

export interface RespuestaCalculo {
  pcaToneladas: number;
  nitrogenoDisponibleKg: number;
  fosforoDisponibleKg: number;
  potasioDisponibleKg: number;
}
