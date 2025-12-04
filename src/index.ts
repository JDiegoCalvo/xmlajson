// src/index.ts
import { XMLParser } from 'fast-xml-parser';
import { RouterCasos } from './casos/index.js';
import { ConfigProcesamiento } from './types/index.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: true,
  parseAttributeValue: true,
  isArray: (name, jpath, isLeafNode, isAttribute) => {
    // Forzar array para estos nodos
    if (name === 'cfdi:Concepto' || name === 'cfdi:Traslado' || 
        name === 'cfdi:Retencion' || name === 'cfdi:Impuestos') {
      return true;
    }
    return false;
  },
});

export async function procesarFacturaXML(
  xmlString: string,
  config: ConfigProcesamiento
) {
  try {
    // 1. Parsear XML a objeto JSON
    const jsonObj = parser.parse(xmlString); 
    const cfdi = jsonObj['cfdi:Comprobante'];
    if (!cfdi) {
      throw new Error('No se encontró el nodo cfdi:Comprobante en el XML');
    }

    // Extraer el Timbre Fiscal Digital
    const timbre = cfdi['cfdi:Complemento']?.['tfd:TimbreFiscalDigital'];
    
    // 2. Normalizar datos con TODOS los campos necesarios
    const xmlData = {
      // Atributos principales del comprobante (para CFDI en ResultadoContable)
      fecha: cfdi['@_Fecha'],
      tipo: cfdi['@_TipoDeComprobante'],
      moneda: cfdi['@_Moneda'],
      subtotal: parseFloat(cfdi['@_SubTotal'] || '0'),
      total: parseFloat(cfdi['@_Total'] || '0'),
      metodoPago: cfdi['@_MetodoPago'],
      formaPago: cfdi['@_FormaPago'],
      lugarExpedicion: cfdi['@_LugarExpedicion'],
      folio: cfdi['@_Folio'] || '',
      serie: cfdi['@_Serie'] || '',
      version: cfdi['@_Version'] || '4.0',
      exportacion: cfdi['@_Exportacion'] || '01',
      impuestos: {
        // Impuestos a nivel comprobante
        traslados: cfdi['cfdi:Impuestos']?.['cfdi:Traslados']?.['cfdi:Traslado'] || [],
        retenciones: cfdi['cfdi:Impuestos']?.['cfdi:Retenciones']?.['cfdi:Retencion'] || [],
        
        // Impuestos a nivel concepto (si los necesitas)
        conceptosImpuestos: (() => {
          const conceptos = cfdi['cfdi:Conceptos']?.['cfdi:Concepto'];
          if (!conceptos) return [];
          
          const conceptosArray = Array.isArray(conceptos) ? conceptos : [conceptos];
          return conceptosArray.map((concepto: any) => ({
            traslados: concepto['cfdi:Impuestos']?.['cfdi:Traslados']?.['cfdi:Traslado'] || [],
            retenciones: concepto['cfdi:Impuestos']?.['cfdi:Retenciones']?.['cfdi:Retencion'] || []
          }));
        })()
      },
      
      // Emisor - datos completos
      emisor: {
        rfc: cfdi['cfdi:Emisor']?.['@_Rfc'],
        nombre: cfdi['cfdi:Emisor']?.['@_Nombre'],
        regimenFiscal: cfdi['cfdi:Emisor']?.['@_RegimenFiscal']
      },
      
      // Receptor - datos completos (¡IMPORTANTE: 'UsoCFDI' no 'usoCFDI'!)
      receptor: {
        rfc: cfdi['cfdi:Receptor']?.['@_Rfc'],
        nombre: cfdi['cfdi:Receptor']?.['@_Nombre'],
        regimenFiscal: cfdi['cfdi:Receptor']?.['@_RegimenFiscalReceptor'],
        usoCFDI: cfdi['cfdi:Receptor']?.['@_UsoCFDI'], // ← Así está en el XML
        domicilioFiscalReceptor: cfdi['cfdi:Receptor']?.['@_DomicilioFiscalReceptor']
      },
      
      // Conceptos
      conceptos: (() => {
        const conceptosNode = cfdi['cfdi:Conceptos'];
        if (!conceptosNode) return [];
        
        const conceptos = conceptosNode['cfdi:Concepto'];
        if (Array.isArray(conceptos)) {
          return conceptos.map(c => ({
            descripcion: c['@_Descripcion'] || '',
            cantidad: parseFloat(c['@_Cantidad'] || '0'),
            valorUnitario: parseFloat(c['@_ValorUnitario'] || '0'),
            importe: parseFloat(c['@_Importe'] || '0'),
            claveProdServ: c['@_ClaveProdServ'] || '',
            claveUnidad: c['@_ClaveUnidad'] || '',
            objetoImp: c['@_ObjetoImp'] || ''
          }));
        } else if (conceptos) {
          return [{
            descripcion: conceptos['@_Descripcion'] || '',
            cantidad: parseFloat(conceptos['@_Cantidad'] || '0'),
            valorUnitario: parseFloat(conceptos['@_ValorUnitario'] || '0'),
            importe: parseFloat(conceptos['@_Importe'] || '0'),
            claveProdServ: conceptos['@_ClaveProdServ'] || '',
            claveUnidad: conceptos['@_ClaveUnidad'] || '',
            objetoImp: conceptos['@_ObjetoImp'] || ''
          }];
        }
        return [];
      })(),
      
      // Timbre Fiscal Digital (TFD) - ¡ESTO ES CLAVE PARA 'pac'!
      uuid: timbre?.['@_UUID'],
      fechaTimbrado: timbre?.['@_FechaTimbrado'],
      // 'pac' en el XML se llama 'RfcProvCertif' en el Timbre
      rfcProvCertif: timbre?.['@_RfcProvCertif'], // ← ESTO ES EL 'pac'
      noCertificadoSAT: timbre?.['@_NoCertificadoSAT'],
      
      // Complemento completo
      complemento: cfdi['cfdi:Complemento']
    };

    // 3. Usar el router para procesar
    const resultado = await RouterCasos.procesar(xmlData, config);
    return resultado;

  } catch (error) {
    console.error('❌ Error procesando factura:', error);
    throw error;
  }
}

// Ejemplo de uso MÁS COMPLETO
async function ejemploUso() {
  // XML de prueba MÁS COMPLETO
  const xmlDeEjemplo = ``

  const config: ConfigProcesamiento = {
    clientId: 123,
    miRFC: 'XAXX010101000',
    regimenFiscal: '626'
  };

  try {
    const resultado = await procesarFacturaXML(xmlDeEjemplo, config);
    console.log('🎉 Resultado obtenido:');
    console.log(JSON.stringify(resultado, null, 2));
  } catch (error) {
    console.error('Error en ejemplo:', error);
  }
}

// Para ejecutar el ejemplo
if (import.meta.url === `file://${process.argv[1]}`) {
  ejemploUso();
}