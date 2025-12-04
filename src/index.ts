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
    if (name === 'cfdi:Concepto') {
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
    
    // 2. Extraer los impuestos de los conceptos (DETALLES COMPLETOS)
    const conceptosImpuestos = (() => {
      const conceptosNode = cfdi['cfdi:Conceptos'];
      if (!conceptosNode) return [];
      
      const conceptos = conceptosNode['cfdi:Concepto'];
      if (!conceptos) return [];
      
      const conceptosArray = Array.isArray(conceptos) ? conceptos : [conceptos];
      
      const todosImpuestos: any[] = [];
      
conceptosArray.forEach(concepto => {
  const conceptoImpuestos = concepto['cfdi:Impuestos'];
  if (!conceptoImpuestos) return;
  
  // Función para normalizar el código de impuesto
  const normalizarImpuesto = (valor: any): string => {
    const str = String(valor || '');
    if (str.length === 1) return `00${str}`;
    if (str.length === 2) return `0${str}`;
    return str;
  };
  
  // Extraer traslados del concepto
  const traslados = conceptoImpuestos['cfdi:Traslados']?.['cfdi:Traslado'];
  if (traslados) {
    const trasladosArray = Array.isArray(traslados) ? traslados : [traslados];
    trasladosArray.forEach((traslado: any) => {
      todosImpuestos.push({
        tipo: 'traslado',
        impuesto: normalizarImpuesto(traslado['@_Impuesto']),
        tipoFactor: traslado['@_TipoFactor'],
        tasa: parseFloat(traslado['@_TasaOCuota'] || 0),
        base: parseFloat(traslado['@_Base'] || 0),
        importe: parseFloat(traslado['@_Importe'] || 0)
      });
    });
  }
  
  // Extraer retenciones del concepto
  const retenciones = conceptoImpuestos['cfdi:Retenciones']?.['cfdi:Retencion'];
  if (retenciones) {
    const retencionesArray = Array.isArray(retenciones) ? retenciones : [retenciones];
    retencionesArray.forEach((retencion: any) => {
      todosImpuestos.push({
        tipo: 'retencion',
        impuesto: normalizarImpuesto(retencion['@_Impuesto']),
        tipoFactor: retencion['@_TipoFactor'],
        tasa: parseFloat(retencion['@_TasaOCuota'] || 0),
        base: parseFloat(retencion['@_Base'] || 0),
        importe: parseFloat(retencion['@_Importe'] || 0)
      });
    });
  }
});
      
      return todosImpuestos;
    })();

    // 3. Normalizar datos
    const xmlData = {
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
      
      // Solo necesitamos los impuestos de los conceptos (detalles completos)
      impuestos: conceptosImpuestos,
      
      emisor: {
        rfc: cfdi['cfdi:Emisor']?.['@_Rfc'],
        nombre: cfdi['cfdi:Emisor']?.['@_Nombre'],
        regimenFiscal: cfdi['cfdi:Emisor']?.['@_RegimenFiscal']
      },
      
      receptor: {
        rfc: cfdi['cfdi:Receptor']?.['@_Rfc'],
        nombre: cfdi['cfdi:Receptor']?.['@_Nombre'],
        regimenFiscal: cfdi['cfdi:Receptor']?.['@_RegimenFiscalReceptor'],
        usoCFDI: cfdi['cfdi:Receptor']?.['@_UsoCFDI'],
        domicilioFiscalReceptor: cfdi['cfdi:Receptor']?.['@_DomicilioFiscalReceptor']
      },
      
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
      
      uuid: timbre?.['@_UUID'],
      fechaTimbrado: timbre?.['@_FechaTimbrado'],
      rfcProvCertif: timbre?.['@_RfcProvCertif'],
      noCertificadoSAT: timbre?.['@_NoCertificadoSAT'],
      
      complemento: cfdi['cfdi:Complemento']
    };

    // DEBUG
    console.log('DEBUG: Impuestos extraídos de conceptos:', xmlData.impuestos);

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
  const xmlDeEjemplo = ``;

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