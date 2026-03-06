import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { CalculoDetalle } from './chacras.service';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  constructor() { }

  generarReporteSuelo(calculo: CalculoDetalle): void {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let yPos = 20;
    const lineHeight = 7;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Reporte de Analisis de Suelo', margin, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Fecha: ' + new Date(calculo.fecha).toLocaleDateString('es-ES'), margin, yPos);
    yPos += lineHeight;
    pdf.text('Muestra: ' + calculo.nombreMuestra, margin, yPos);
    yPos += lineHeight + 5;

    yPos = this.agregarDatosEntrada(pdf, calculo, margin, yPos, lineHeight, pageHeight);

    if (calculo.resultados.balanceNutricional) {
      yPos = this.agregarBalanceNutricional(pdf, calculo, margin, yPos, lineHeight, pageHeight);
    }

    if (calculo.resultados.recomendacionFertilizacion) {
      yPos = this.agregarRecomendacionFertilizacion(pdf, calculo, margin, yPos, lineHeight, pageHeight);
    }

    if (calculo.resultados.micronutrientes) {
      yPos = this.agregarMicronutrientes(pdf, calculo, margin, yPos, lineHeight, pageHeight);
    }

    if (calculo.resultados.cronograma && calculo.resultados.cronograma.length > 0) {
      yPos = this.agregarCronograma(pdf, calculo, margin, yPos, lineHeight, pageHeight);
    }

    if (calculo.resultados.alertas && calculo.resultados.alertas.length > 0) {
      yPos = this.agregarAlertas(pdf, calculo, margin, yPos, lineHeight, pageHeight);
    }

    const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    const nombreArchivo = 'Analisis_Suelo_' + calculo.nombreMuestra + '_' + fecha + '.pdf';
    pdf.save(nombreArchivo);
  }

  private agregarDatosEntrada(pdf: jsPDF, calculo: CalculoDetalle, margin: number, yPos: number, lineHeight: number, pageHeight: number): number {
    if (yPos > pageHeight - 30) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Datos de Entrada', margin, yPos);
    yPos += lineHeight;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const datos = [
      'Area: ' + calculo.datosEntrada.areaHa + ' ha',
      'pH: ' + calculo.datosEntrada.ph,
      'CE: ' + calculo.datosEntrada.ce + ' dS/m',
      'MO: ' + calculo.datosEntrada.materiaOrganica + ' %',
      'P: ' + calculo.datosEntrada.fosforoPpm + ' ppm',
      'K: ' + calculo.datosEntrada.potasioPpm + ' ppm'
    ];

    datos.forEach(d => {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(d, margin + 5, yPos);
      yPos += lineHeight;
    });

    return yPos + 5;
  }

  private agregarBalanceNutricional(pdf: jsPDF, calculo: CalculoDetalle, margin: number, yPos: number, lineHeight: number, pageHeight: number): number {
    if (yPos > pageHeight - 30) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Balance Nutricional', margin, yPos);
    yPos += lineHeight;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    pdf.text('N: ' + (calculo.resultados.nitrogenoDisponibleKg || 0).toFixed(2) + ' kg/ha', margin + 5, yPos);
    yPos += lineHeight;
    pdf.text('P: ' + (calculo.resultados.fosforoDisponibleKg || 0).toFixed(2) + ' kg/ha', margin + 5, yPos);
    yPos += lineHeight;
    pdf.text('K: ' + (calculo.resultados.potasioDisponibleKg || 0).toFixed(2) + ' kg/ha', margin + 5, yPos);
    yPos += lineHeight;

    return yPos + 5;
  }

  private agregarRecomendacionFertilizacion(pdf: jsPDF, calculo: CalculoDetalle, margin: number, yPos: number, lineHeight: number, pageHeight: number): number {
    if (yPos > pageHeight - 30) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recomendacion de Fertilizacion', margin, yPos);
    yPos += lineHeight + 3;

    pdf.setFontSize(10);

    if (calculo.resultados.recomendacionFertilizacion.Nitrogeno) {
      const n = calculo.resultados.recomendacionFertilizacion.Nitrogeno;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Nitrogeno (N)', margin + 5, yPos);
      yPos += lineHeight;

      pdf.setFont('helvetica', 'normal');
      pdf.text('  Producto: ' + n.producto, margin + 5, yPos);
      yPos += lineHeight;
      pdf.text('  Cantidad: ' + n.cantidad_kg_ha.toFixed(2) + ' kg/ha', margin + 5, yPos);
      yPos += lineHeight;
      pdf.text('  Sacos: ' + n.sacos.toFixed(1), margin + 5, yPos);
      yPos += lineHeight + 3;
    }

    if (calculo.resultados.recomendacionFertilizacion.Fosforo) {
      const p = calculo.resultados.recomendacionFertilizacion.Fosforo;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Fosforo (P2O5)', margin + 5, yPos);
      yPos += lineHeight;

      pdf.setFont('helvetica', 'normal');
      pdf.text('  Producto: ' + p.producto, margin + 5, yPos);
      yPos += lineHeight;
      pdf.text('  Cantidad: ' + p.cantidad_kg_ha.toFixed(2) + ' kg/ha', margin + 5, yPos);
      yPos += lineHeight;
      pdf.text('  Sacos: ' + p.sacos.toFixed(1), margin + 5, yPos);
      yPos += lineHeight + 3;
    }

    if (calculo.resultados.recomendacionFertilizacion.Potasio) {
      const k = calculo.resultados.recomendacionFertilizacion.Potasio;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Potasio (K2O)', margin + 5, yPos);
      yPos += lineHeight;

      pdf.setFont('helvetica', 'normal');
      pdf.text('  Producto: ' + k.producto, margin + 5, yPos);
      yPos += lineHeight;
      pdf.text('  Cantidad: ' + k.cantidad_kg_ha.toFixed(2) + ' kg/ha', margin + 5, yPos);
      yPos += lineHeight;
      pdf.text('  Sacos: ' + k.sacos.toFixed(1), margin + 5, yPos);
      yPos += lineHeight + 3;
    }

    return yPos + 5;
  }

  private agregarMicronutrientes(pdf: jsPDF, calculo: CalculoDetalle, margin: number, yPos: number, lineHeight: number, pageHeight: number): number {
    if (yPos > pageHeight - 30) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Micronutrientes', margin, yPos);
    yPos += lineHeight;

    pdf.setFontSize(9);
    Object.keys(calculo.resultados.micronutrientes).forEach(elem => {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 20;
      }

      const m = calculo.resultados.micronutrientes[elem];
      pdf.setFont('helvetica', 'bold');
      pdf.text(elem + ': ' + m.valor + ' ppm', margin + 5, yPos);
      yPos += lineHeight;

      pdf.setFont('helvetica', 'normal');
      pdf.text('  Estado: ' + m.diagnostico, margin + 5, yPos);
      yPos += lineHeight;
      pdf.text('  ' + m.recomendacion, margin + 5, yPos, { maxWidth: 170 });
      yPos += lineHeight + 2;
    });

    return yPos + 5;
  }

  private agregarCronograma(pdf: jsPDF, calculo: CalculoDetalle, margin: number, yPos: number, lineHeight: number, pageHeight: number): number {
    if (yPos > pageHeight - 30) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Cronograma de Aplicacion', margin, yPos);
    yPos += lineHeight;

    pdf.setFontSize(10);
    calculo.resultados.cronograma.forEach((etapa: any) => {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.text(etapa.etapa + ' - ' + etapa.momento, margin + 5, yPos);
      yPos += lineHeight;

      pdf.setFont('helvetica', 'normal');
      etapa.aplicaciones.forEach((app: any) => {
        if (yPos > pageHeight - 30) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text('  - ' + app.producto + ': ' + app.dosis_kg.toFixed(1) + ' kg/ha (' + app.sacos.toFixed(1) + ' sacos)', margin + 5, yPos);
        yPos += lineHeight;
      });
      yPos += 3;
    });

    return yPos + 5;
  }

  private agregarAlertas(pdf: jsPDF, calculo: CalculoDetalle, margin: number, yPos: number, lineHeight: number, pageHeight: number): number {
    if (yPos > pageHeight - 30) {
      pdf.addPage();
      yPos = 20;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Alertas', margin, yPos);
    yPos += lineHeight;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    calculo.resultados.alertas.forEach((alerta: any) => {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text('- ' + alerta.parametro + ': ' + alerta.mensaje, margin + 5, yPos, { maxWidth: 170 });
      yPos += lineHeight + 2;
    });

    return yPos;
  }
}
