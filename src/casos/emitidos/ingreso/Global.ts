import { BaseProcessor } from '../../../core/baseProcessor.js';
import { ResultadoContable } from '../../../types/index.js';

export class IngresoGlobalEmitido extends BaseProcessor {
  static readonly tipo = 'I' as const;
  static readonly metodoPago = 'PUE' as const;
  static readonly descripcion = 'Venta contado (emitida)';
  
  async procesar(xmlData: any): Promise<ResultadoContable> {
    const ivaTrasladado = xmlData.total - xmlData.subtotal;
    
    return {
      CFDI: this.extraerCFDI(xmlData),
      CLIENTE: {
        ...this.extraerEntidad(xmlData, 'emisor'),
        client_id: this.config.clientId
      },
      PROVEEDOR: this.extraerEntidad(xmlData, 'receptor'),
      REALIZACION: {
        CARGOS: [
          this.crearMovimiento(
            '101', '1', '0',
            xmlData.total,
            0,
            xmlData.conceptos?.[0]?.descripcion || 'Cobro contado'
          )
        ],
        ABONOS: [
          this.crearMovimiento(
            '401', '1', '0',
            0,
            xmlData.total,
            xmlData.conceptos?.[0]?.descripcion || 'Venta contado'
          ),
          this.crearMovimiento(
            '208', '1', '0',
            0,
            ivaTrasladado,
            'IVA trasladado'
          )
        ]
      }
    };
  }
}