// src/index.ts
import { XMLParser } from 'fast-xml-parser';
import { RouterCasos } from './casos/index.js';
import { ConfigProcesamiento } from './types/index.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
});

export async function procesarFacturaXML(
  xmlString: string,
  config: ConfigProcesamiento
) {
  try {
    // 1. Parsear XML a objeto JSON
    const jsonObj = parser.parse(xmlString);
    const cfdi = jsonObj['cfdi:Comprobante'];

    // 2. Normalizar datos (simplificación, ajusta según tu XML real)
    const xmlData = {
      ...cfdi['@_'], // Atributos principales (Fecha, Tipo, SubTotal, etc.)
      emisor: cfdi['cfdi:Emisor']?.['@_'],
      receptor: cfdi['cfdi:Receptor']?.['@_'],
      conceptos: cfdi['cfdi:Conceptos']?.['cfdi:Concepto'],
      complemento: cfdi['cfdi:Complemento'],
      // ... extraer más datos si es necesario
    };

    // 3. Usar el router para procesar
    const resultado = await RouterCasos.procesar(xmlData, config);
    return resultado;

  } catch (error) {
    console.error('Error procesando factura:', error);
    throw error; // O manejar el error de forma más específica
  }
}

// Ejemplo de uso (para pruebas)
async function ejemploUso() {
  const xmlDeEjemplo = `<?xml version="1.0"?>
  <cfdi:Comprobante Fecha="2024-01-15" ...>
    <!-- ... tu XML aquí ... -->
  </cfdi:Comprobante>`;

  const config: ConfigProcesamiento = {
    clientId: 123,
    miRFC: 'CATJ920410000', // <-- TU RFC aquí
    regimenFiscal: '626'
  };

  const resultado = await procesarFacturaXML(xmlDeEjemplo, config);
  console.log(JSON.stringify(resultado, null, 2));
}

// Para ejecutar el ejemplo al correr el archivo directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  ejemploUso();
}