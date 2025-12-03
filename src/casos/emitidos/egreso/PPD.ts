import { BaseProcessor } from '../../../core/baseProcessor.js';
import { ResultadoContable } from '../../../types/index.js';

export class EgresoPPDEmitido extends BaseProcessor {
  static readonly tipo = 'E' as const;
  static readonly metodoPago = 'PPD' as const;
  static readonly descripcion = 'Nota de crédito a crédito (emitida)';
  
  async procesar(xmlData: any): Promise<ResultadoContable> {
    const ivaTrasladado = xmlData.total - xmlData.subtotal;
    
    return {
      CFDI: this.extraerCFDI(xmlData),
      CLIENTE: {
        ...this.extraerEntidad(xmlData, 'emisor'),
        client_id: this.config.clientId
      },
      PROVEEDOR: this.extraerEntidad(xmlData, 'receptor'),
      DEVENGACION: {
        CARGOS: [
          this.crearMovimiento(
            '401', '1', '0',
            xmlData.subtotal,
            0,
            xmlData.conceptos?.[0]?.descripcion || 'Devolución sobre venta'
          ),
          this.crearMovimiento(
            '205', '1', '0',
            ivaTrasladado,
            0,
            'IVA por cobrar (reducción)'
          )
        ],
        ABONOS: [
          this.crearMovimiento(
            '105', '1', 'X',
            0,
            xmlData.subtotal + ivaTrasladado,
            xmlData.conceptos?.[0]?.descripcion || 'Nota de crédito a cliente'
          )
        ]
      }
    };
  }
}