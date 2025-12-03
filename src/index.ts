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
    // Forzar array para estos nodos que pueden repetirse
    if (name === 'cfdi:Concepto' || name === 'cfdi:Traslado' || name === 'cfdi:Retencion') {
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
    
    // ⭐ DEPURACIÓN: Descomenta esto temporalmente para ver la estructura real
    // console.log('=== ESTRUCTURA DEL PARSER ===');
    // console.log(JSON.stringify(jsonObj, null, 2).substring(0, 1000));
    // console.log('=============================');
    
    const cfdi = jsonObj['cfdi:Comprobante'];
    if (!cfdi) {
      throw new Error('No se encontró el nodo cfdi:Comprobante en el XML');
    }

    // 2. Normalizar datos - FORMA CORRECTA
    const xmlData = {
      // Atributos principales del comprobante
      fecha: cfdi['@_Fecha'],
      tipo: cfdi['@_TipoDeComprobante'],
      moneda: cfdi['@_Moneda'],
      subtotal: parseFloat(cfdi['@_SubTotal'] || '0'),
      total: parseFloat(cfdi['@_Total'] || '0'),
      metodoPago: cfdi['@_MetodoPago'],
      formaPago: cfdi['@_FormaPago'],
      lugarExpedicion: cfdi['@_LugarExpedicion'],
      
      // Emisor y Receptor - ASÍ ES LA FORMA CORRECTA
      emisor: {
        rfc: cfdi['cfdi:Emisor']?.['@_Rfc'],
        nombre: cfdi['cfdi:Emisor']?.['@_Nombre'],
        regimenFiscal: cfdi['cfdi:Emisor']?.['@_RegimenFiscal']
      },
      receptor: {
        rfc: cfdi['cfdi:Receptor']?.['@_Rfc'],
        nombre: cfdi['cfdi:Receptor']?.['@_Nombre'],
        regimenFiscal: cfdi['cfdi:Receptor']?.['@_RegimenFiscalReceptor'],
        usoCFDI: cfdi['cfdi:Receptor']?.['@_UsoCFDI']
      },
      
      // Conceptos - Manejar tanto array como objeto único
      conceptos: (() => {
        const conceptosNode = cfdi['cfdi:Conceptos'];
        if (!conceptosNode) return [];
        
        const conceptos = conceptosNode['cfdi:Concepto'];
        if (Array.isArray(conceptos)) {
          return conceptos.map(c => ({
            descripcion: c['@_Descripcion'],
            cantidad: parseFloat(c['@_Cantidad'] || '0'),
            valorUnitario: parseFloat(c['@_ValorUnitario'] || '0'),
            importe: parseFloat(c['@_Importe'] || '0')
          }));
        } else if (conceptos) {
          // Si es un solo concepto (objeto)
          return [{
            descripcion: conceptos['@_Descripcion'],
            cantidad: parseFloat(conceptos['@_Cantidad'] || '0'),
            valorUnitario: parseFloat(conceptos['@_ValorUnitario'] || '0'),
            importe: parseFloat(conceptos['@_Importe'] || '0')
          }];
        }
        return [];
      })(),
      
      // Timbre Fiscal (UUID)
      uuid: cfdi['cfdi:Complemento']?.['tfd:TimbreFiscalDigital']?.['@_UUID'],
      fechaTimbrado: cfdi['cfdi:Complemento']?.['tfd:TimbreFiscalDigital']?.['@_FechaTimbrado'],
      
      // Complemento completo (para nómina, pagos, etc.)
      complemento: cfdi['cfdi:Complemento']
    };

    console.log('✅ Datos extraídos correctamente:');
    console.log(`   UUID: ${xmlData.uuid}`);
    console.log(`   Emisor: ${xmlData.emisor.rfc} - ${xmlData.emisor.nombre}`);
    console.log(`   Receptor: ${xmlData.receptor.rfc} - ${xmlData.receptor.nombre}`);
    console.log(`   Conceptos: ${xmlData.conceptos.length}`);

    // 3. Usar el router para procesar
    const resultado = await RouterCasos.procesar(xmlData, config);
    return resultado;

  } catch (error) {
    console.error('❌ Error procesando factura:', error);
    throw error;
  }
}

// Ejemplo de uso (para pruebas) - CON XML REAL
async function ejemploUso() {
  // XML de prueba REAL - usa uno de tus XML reales
  const xmlDeEjemplo = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" 
                  Fecha="2024-01-15T12:00:00"
                  TipoDeComprobante="I"
                  SubTotal="1000.00"
                  Total="1160.00"
                  MetodoPago="PUE">
  <cfdi:Emisor Rfc="AAA010101AAA" Nombre="EMISOR PRUEBA" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="CATJ920410000" Nombre="CLIENTE PRUEBA" UsoCFDI="G03"/>
  <cfdi:Conceptos>
    <cfdi:Concepto Descripcion="SERVICIO DE PRUEBA" Cantidad="1" 
                   ValorUnitario="1000.00" Importe="1000.00"/>
  </cfdi:Conceptos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital UUID="12345678-1234-1234-1234-123456789012"
                             FechaTimbrado="2024-01-15T12:05:00"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

  const config: ConfigProcesamiento = {
    clientId: 123,
    miRFC: 'CATJ920410000', // Tu RFC
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

// Para ejecutar el ejemplo al correr el archivo directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  ejemploUso();
}