import { BaseProcessor } from '@/core/baseProcessor.js';
import { ResultadoContable } from '@/types/index.js';

export class IngresoPPDEmitido extends BaseProcessor {
  static readonly tipo = 'I' as const;
  static readonly metodoPago = 'PPD' as const;
  static readonly descripcion = 'Venta a crédito (emitida)';
  
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
            '105', '1', 'X',
            xmlData.subtotal + ivaTrasladado,
            0,
            xmlData.conceptos?.[0]?.descripcion || 'Venta a crédito'
          )
        ],
        ABONOS: [
          this.crearMovimiento(
            '401', '1', '0',
            0,
            xmlData.subtotal,
            xmlData.conceptos?.[0]?.descripcion || 'Ingresos'
          ),
          this.crearMovimiento(
            '205', '1', '0',
            0,
            ivaTrasladado,
            'IVA por cobrar'
          )
        ]
      }
    };
  }
}