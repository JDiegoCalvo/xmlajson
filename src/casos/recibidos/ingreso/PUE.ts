import { BaseProcessor } from '../../../core/baseProcessor.js';
import type { ResultadoContable } from '../../../types/index.js';

export class IngresoPUERecibido extends BaseProcessor {
  static readonly tipo = 'I' as const;
  static readonly metodoPago = 'PUE' as const;
  static readonly descripcion = 'Compra de contado (recibida)';

  async procesar(xmlData: any): Promise<ResultadoContable> {
    const ivaTrasladado = xmlData.total - xmlData.subtotal;
    
    return {
      CFDI: this.extraerCFDI(xmlData),
      CLIENTE: {
        ...this.extraerEntidad(xmlData, 'receptor'),
        client_id: this.config.clientId
      },
      PROVEEDOR: this.extraerEntidad(xmlData, 'emisor'),
      REALIZACION: {
        CARGOS: [
          this.crearMovimiento(
            '501', '1', '0',  // Gastos
            xmlData.subtotal,
            0,
            xmlData.conceptos?.[0]?.descripcion || 'Compra de contado'
          ),
          this.crearMovimiento(
            '208', '1', '0',  // IVA por pagar
            ivaTrasladado,
            0,
            'IVA por pagar'
          )
        ],
        ABONOS: [
          this.crearMovimiento(
            '101', '1', '0',  // Efectivo/Bancos
            0,
            xmlData.total,
            'Pago a proveedor'
          )
        ]
      }
    };
  }
}