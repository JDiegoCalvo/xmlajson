import { BaseProcessor } from '../../../core/baseProcessor.js';
import type { ResultadoContable } from '../../../types/index.js';

export class NominaEmitida extends BaseProcessor {
  static readonly tipo = 'N' as const;
  static readonly descripcion = 'Nómina emitida (como patrón)';

  async procesar(xmlData: any): Promise<ResultadoContable> {
    // Extraer datos específicos de nómina del complemento
    const complementoNomina = xmlData.complemento?.['nomina12:Nomina'];
    const percepciones = complementoNomina?.Percepciones?.Percepcion || [];
    const deducciones = complementoNomina?.Deducciones?.Deduccion || [];
    
    const totalPercepciones = parseFloat(complementoNomina?.['@_TotalPercepciones']) || 0;
    const totalDeducciones = parseFloat(complementoNomina?.['@_TotalDeducciones']) || 0;
    const totalOtrosPagos = parseFloat(complementoNomina?.['@_TotalOtrosPagos']) || 0;
    
    // El neto a pagar = TotalPercepciones - TotalDeducciones + TotalOtrosPagos
    const netoAPagar = totalPercepciones - totalDeducciones + totalOtrosPagos;
    
    // Generar movimientos de nómina
    const cargos: any[] = [];
    const abonos: any[] = [];
    
    // CARGO: Gastos por sueldos y salarios (neto a pagar + deducciones)
    cargos.push(this.crearMovimiento(
      '501', '1', '0',  // Gastos de nómina
      totalPercepciones + totalOtrosPagos,
      0,
      'Sueldos y salarios'
    ));
    
    // Si hay deducciones, se registran como obligaciones a cargo del patrón
    if (totalDeducciones > 0) {
      // Ejemplo: ISR retenido (cuenta 101.1.0)
      cargos.push(this.crearMovimiento(
        '101', '1', '0',  // ISR retenido
        totalDeducciones,
        0,
        'Deducciones de nómina (ISR, IMSS, etc.)'
      ));
    }
    
    // ABONO: Bancos (por el neto pagado al empleado)
    abonos.push(this.crearMovimiento(
      '101', '1', 'X',  // Efectivo/Bancos (X = cuenta específica)
      0,
      netoAPagar,
      'Pago de nómina'
    ));
    
    // ABONO: Obligaciones patronales (IMSS, INFONAVIT, etc.)
    // Nota: Esto es simplificado. En realidad cada deducción va a cuenta específica
    if (totalDeducciones > 0) {
      abonos.push(this.crearMovimiento(
        '208', '1', '0',  // Obligaciones por pagar
        0,
        totalDeducciones,
        'Obligaciones patronales'
      ));
    }
    
    return {
      CFDI: this.extraerCFDI(xmlData),
      CLIENTE: {
        ...this.extraerEntidad(xmlData, 'emisor'),
        client_id: this.config.clientId
      },
      PROVEEDOR: this.extraerEntidad(xmlData, 'receptor'),
      REALIZACION: {
        CARGOS: cargos,
        ABONOS: abonos
      },
      // Datos específicos de nómina para referencia
      metadata: {
        totalPercepciones,
        totalDeducciones,
        netoAPagar,
        empleado: xmlData.receptor.nombre,
        rfcEmpleado: xmlData.receptor.rfc,
        periodoPago: complementoNomina?.['@_FechaPago'] || ''
      }
    };
  }
}

export { NominaEmitida };