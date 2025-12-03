import { BaseProcessor } from '../../../core/baseProcessor.js';
import type { ResultadoContable } from '../../../types/index.js';

export class PagoEmitido extends BaseProcessor {
  static readonly tipo = 'P' as const;
  static readonly descripcion = 'Complemento de pago emitido';

  async procesar(xmlData: any): Promise<ResultadoContable> {
    // Extraer datos del complemento de pago
    const complementoPago = xmlData.complemento?.['pago20:Pago'];
    const doctosRelacionados = complementoPago?.DoctosRelacionados?.DoctoRelacionado || [];
    
    const montoTotalPago = parseFloat(complementoPago?.['@_Monto']) || 0;
    const formaPago = complementoPago?.['@_FormaPago'] || '99';
    
    // Calcular retenciones totales
    let totalRetenciones = 0;
    const retencionesDetalle: any[] = [];
    
    doctosRelacionados.forEach((docto: any) => {
      const retenciones = docto.ImpuestosDR?.RetencionesDR?.RetencionDR || [];
      retenciones.forEach((ret: any) => {
        const importe = parseFloat(ret['@_ImporteDR']) || 0;
        totalRetenciones += importe;
        retencionesDetalle.push({
          impuesto: ret['@_ImpuestoDR'],
          importe
        });
      });
    });
    
    // Monto neto transferido = TotalPago - Retenciones
    const netoTransferido = montoTotalPago - totalRetenciones;
    
    // Generar movimientos
    const cargos: any[] = [];
    const abonos: any[] = [];
    const retenciones: any[] = [];
    
    // CARGO: Cuentas por cobrar (se reducen)
    doctosRelacionados.forEach((docto: any) => {
      const importeDocto = parseFloat(docto['@_ImpSaldoAnt']) || 0;
      cargos.push(this.crearMovimiento(
        '105', '1', 'X',  // Cliente específico
        importeDocto,
        0,
        `Liquidación factura ${docto['@_IdDocumento']}`
      ));
    });
    
    // ABONO: Efectivo/Bancos (por el neto transferido)
    abonos.push(this.crearMovimiento(
      '101', '1', 'X',  // Cuenta bancaria específica
      0,
      netoTransferido,
      'Transferencia por pago'
    ));
    
    // RETENCIONES: Se registran por separado
    retencionesDetalle.forEach(ret => {
      let cuenta = '';
      switch(ret.impuesto) {
        case '001': cuenta = '101'; break; // ISR
        case '002': cuenta = '102'; break; // IVA
        case '003': cuenta = '103'; break; // IEPS
        default: cuenta = '109'; // Otros impuestos
      }
      
      retenciones.push(this.crearMovimiento(
        cuenta, '1', '0',
        0,
        ret.importe,
        `Retención ${ret.impuesto}`
      ));
    });
    
    // Si hay retenciones, también se abonan en la cuenta de retenciones
    if (totalRetenciones > 0) {
      abonos.push(this.crearMovimiento(
        '209', '1', '0',  // Retenciones por enterar
        0,
        totalRetenciones,
        'Retenciones aplicadas'
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
        ABONOS: abonos,
        RETENCIONES: retenciones
      },
    };
  }
}