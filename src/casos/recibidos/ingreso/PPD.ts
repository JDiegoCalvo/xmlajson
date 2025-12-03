import { BaseProcessor } from '../../../core/baseProcessor.js';
import type { ResultadoContable } from '../../../types/index.js';

export class IngresoPPDRecibido extends BaseProcessor {
  static readonly tipo = 'I' as const;
  static readonly metodoPago = 'PPD' as const;
  static readonly descripcion = 'Compra a crédito (recibida)';

  async procesar(xmlData: any): Promise<ResultadoContable> {
    const ivaTrasladado = xmlData.total - xmlData.subtotal;
    
    // NOTA: Emisor = Proveedor, Receptor = Yo
    return {
      CFDI: this.extraerCFDI(xmlData),
      CLIENTE: {
        ...this.extraerEntidad(xmlData, 'receptor'), // Yo soy el receptor
        client_id: this.config.clientId
      },
      PROVEEDOR: this.extraerEntidad(xmlData, 'emisor'), // El proveedor es el emisor
      DEVENGACION: {
        CARGOS: [
          this.crearMovimiento(
            '501', '1', '0',  // Gastos
            xmlData.subtotal,
            0,
            xmlData.conceptos?.[0]?.descripcion || 'Compra a crédito'
          ),
          this.crearMovimiento(
            '208', '1', '0',  // IVA por pagar (acreedor)
            ivaTrasladado,
            0,
            'IVA por pagar'
          )
        ],
        ABONOS: [
          this.crearMovimiento(
            '201', '1', 'X',  // Proveedores
            0,
            xmlData.subtotal + ivaTrasladado,
            xmlData.conceptos?.[0]?.descripcion || 'Proveedor'
          )
        ]
      }
    };
  }
}