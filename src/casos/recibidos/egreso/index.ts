import { BaseProcessor } from '../../../core/baseProcessor.js';
import type { ResultadoContable } from '../../../types/index.js';

// La clase NO se exporta aquí
class EgresoRecibido extends BaseProcessor {
  static readonly tipo = 'E' as const;
  static readonly descripcion = 'Nota de crédito recibida';

  async procesar(xmlData: any): Promise<ResultadoContable> {
    // Lógica específica para notas de crédito recibidas
    throw new Error('Por implementar: EgresoRecibido');
  }
}
// Se exporta aquí
export { EgresoRecibido };