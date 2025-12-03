import { XMLParser } from 'fast-xml-parser';
import { RouterCasos } from './casos/index.js';
import { ConfigProcesamiento } from './types/index.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true
});

export async function procesarFacturaXML(
  xmlString: string,
  config: ConfigProcesamiento
) {
  try {
    // 1. Parsear XML
    const jsonObj = parser.parse(xmlString);
    const cfdi = jsonObj['cfdi:Comprobante'];
    
    // 2. Normalizar datos
    const xmlData = {
      ...cfdi['@_'],
      emisor: cfdi['cfdi:Emisor']['@_'],
      receptor: cfdi['cfdi:Receptor']['@_'],
      timbre: cfdi['cfdi:Complemento']?.['tfd:TimbreFiscalDigital']?.['@_'],
      conceptos: cfdi['cfdi:Conceptos']?.['cfdi:Concepto']
    };
    
    // 3. Determinar y procesar caso
    const resultado = await RouterCasos.procesar(xmlData, config);
    
    return resultado;
    
  } catch (error) {
    console.error('Error procesando factura:', error);
    throw error;
  }
}

// Ejemplo de uso
async function ejemplo() {
  const xmlString = `...tu XML aquí...`;
  
  const config: ConfigProcesamiento = {
    clientId: 123,
    miRFC: 'CATJ920410000',
    regimenFiscal: '626'
  };
  
  try {
    const resultado = await procesarFacturaXML(xmlString, config);
    console.log(JSON.stringify(resultado, null, 2));
    
    // Aquí podrías guardar en BD, etc.
    
  } catch (error) {
    console.error('Error:', error);
  }
}