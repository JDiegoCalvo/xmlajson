import { IngresoPPDEmitido } from './ingreso/PPD.js';
import { IngresoPUEEmitido } from './ingreso/PUE.js';
import { EgresoPPDEmitido } from './egreso/PPD.js';
import { EgresoPUEEmitido } from './egreso/PUE.js';
import { NominaEmitida } from './nomina.js';
import { PagoEmitido } from './pago.js';
import { BaseProcessor } from '@/core/baseProcessor.js';

type TipoComprobante = 'I' | 'E' | 'P' | 'N';
type MetodoPago = 'PUE' | 'PPD';

export function determinarCasoEmitidos(
  tipo: TipoComprobante, 
  metodoPago?: MetodoPago
): new (config: any) => BaseProcessor {
  
  const casos: Record<string, new (config: any) => BaseProcessor> = {
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

export const CASOS_EMITIDOS = {
  'I-PPD': IngresoPPDEmitido,
  'I-PUE': IngresoPUEEmitido,
  'E-PPD': EgresoPPDEmitido,
  'E-PUE': EgresoPUEEmitido,
  'N': NominaEmitida,
  'P': PagoEmitido
};