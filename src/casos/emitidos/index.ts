import { IngresoPPDEmitido } from './ingreso/PPD.js';
import { IngresoPUEEmitido } from './ingreso/PUE.js';
import { EgresoPPDEmitido } from './egreso/PPD.js';
import { EgresoPUEEmitido } from './egreso/PUE.js';
import { NominaEmitida } from './nomina/index.js';
import { PagoEmitido } from './pago/index.js';

export function determinarCasoEmitidos(tipo: string, metodoPago?: string) {
  const casos: Record<string, any> = {
    'I-PPD': IngresoPPDEmitido,
    'I-PUE': IngresoPUEEmitido,
    'E-PPD': EgresoPPDEmitido,
    'E-PUE': EgresoPUEEmitido,
    'N': NominaEmitida,
    'P': PagoEmitido
  };

  const key = metodoPago ? `${tipo}-${metodoPago}` : tipo;
  const Caso = casos[key];

  if (!Caso) {
    throw new Error(`Caso emitido no implementado: ${key}`);
  }

  return Caso;
}