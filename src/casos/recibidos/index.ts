import { BaseProcessor } from '../../core/baseProcessor.js';
import { IngresoPPDRecibido, IngresoPUERecibido } from './ingreso/index.js';
import { EgresoRecibido } from './egreso/index.js';
import { NominaRecibida } from './nomina/index.js';
import { PagoRecibido } from './pago/index.js';

export function determinarCasoRecibidos(tipo: string, metodoPago?: string): new (config: any) => BaseProcessor {
  const casos: Record<string, new (config: any) => BaseProcessor> = {
    'I-PPD': IngresoPPDRecibido,
    'I-PUE': IngresoPUERecibido,
    'E': EgresoRecibido,
    'N': NominaRecibida,
    'P': PagoRecibido
  };

  const key = metodoPago ? `${tipo}-${metodoPago}` : tipo;
  const Caso = casos[key];

  if (!Caso) {
    throw new Error(`Caso recibido no implementado: ${key}`);
  }

  return Caso;
}

export const CASOS_RECIBIDOS = {
  'I-PPD': IngresoPPDRecibido,
  'I-PUE': IngresoPUERecibido,
  'E': EgresoRecibido,
  'N': NominaRecibida,
  'P': PagoRecibido
};