import { BaseProcessor } from '../../../core/baseProcessor.js';
import { ResultadoContable } from '../../../types/index.js';

export class EgresoPUEEmitido extends BaseProcessor {
  static readonly tipo = 'E' as const;
  static readonly metodoPago = 'PUE' as const;
  static readonly descripcion = 'Nota de crédito contado (emitida)';
  
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
            '105', '1', 'X',
            xmlData.subtotal + ivaTrasladado,
            0,
            xmlData.conceptos?.[0]?.descripcion || 'Devolución a cliente'
          )
        ],
        ABONOS: [
          this.crearMovimiento(
            '101', '1', '0',
            0,
            xmlData.total,
            xmlData.conceptos?.[0]?.descripcion || 'Reembolso en efectivo'
          ),
          this.crearMovimiento(
            '205', '1', '0',
            0,
            ivaTrasladado,
            'IVA por cobrar (reducción)'
          )
        ]
      }
    };
  }
}