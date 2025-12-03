import { BaseProcessor } from '@/core/baseProcessor.js';
import { ConfigProcesamiento } from '@/types/index.js';
import { determinarCasoEmitidos } from './emitidos/index.js';
import { determinarCasoRecibidos } from './recibidos/index.js';

export class RouterCasos {
  static async procesar(
    xmlData: any, 
    config: ConfigProcesamiento
  ): Promise<ReturnType<BaseProcessor['procesar']>> {
    
    const emisorRFC = xmlData.emisor?.rfc;
    const receptorRFC = xmlData.receptor?.rfc;
    
    // Determinar si es emitido o recibido
    let Caso: new (config: ConfigProcesamiento) => BaseProcessor;
    
    if (emisorRFC === config.miRFC) {
      // Es EMITIDO (yo soy el emisor)
      Caso = determinarCasoEmitidos(xmlData.tipo, xmlData.metodoPago);
    } else if (receptorRFC === config.miRFC) {
      // Es RECIBIDO (yo soy el receptor)
      Caso = determinarCasoRecibidos(xmlData.tipo, xmlData.metodoPago);
    } else {
      throw new Error(`El RFC no coincide: Mi RFC=${config.miRFC}, Emisor=${emisorRFC}, Receptor=${receptorRFC}`);
    }
    
    // Crear instancia y procesar
    const procesador = new Caso(config);
    return await procesador.procesar(xmlData);
  }
}