import { CFDIData, Entidad, ResultadoContable, ConfigProcesamiento } from '@/types';

export abstract class BaseProcessor {
  protected config: ConfigProcesamiento;
  
  constructor(config: ConfigProcesamiento) {
    this.config = config;
  }
  
  abstract procesar(xmlData: any): Promise<ResultadoContable>;
  
  // Métodos protegidos comunes
  protected extraerCFDI(xmlData: any): CFDIData {
    return {
      folio_fiscal: xmlData.uuid,
      ejercicio: xmlData.fecha.substring(0, 4),
      periodo: xmlData.fecha.substring(5, 7),
      fecha_expedicion: xmlData.fecha.substring(0, 10),
      fecha_certificacion: xmlData.fechaTimbrado?.substring(0, 10) || '',
      fecha_pago: '',
      uso_de_cfdi: xmlData.usoCFDI || '',
      pac: xmlData.rfcProvCertif || '',
      version: xmlData.version,
      folio: xmlData.folio,
      serie: xmlData.serie,
      tipo_de_comprobante: xmlData.tipo,
      moneda: xmlData.moneda,
      subtotal: xmlData.subtotal,
      total: xmlData.total,
      lugar_expedicion: xmlData.lugarExpedicion,
      forma_de_pago: xmlData.formaPago,
      metodo_de_pago: xmlData.metodoPago,
      exportacion: xmlData.exportacion || '01'
    };
  }
  
  protected extraerEntidad(xmlData: any, tipo: 'emisor' | 'receptor'): Entidad {
    const entidad = xmlData[tipo];
    return {
      nombre: entidad.nombre,
      rfc: entidad.rfc,
      regimen_fiscal: entidad.regimenFiscal,
      lugar_expedicion: tipo === 'emisor' ? xmlData.lugarExpedicion : undefined,
      lugar_recepcion: tipo === 'receptor' ? entidad.domicilioFiscalReceptor : undefined
    };
  }
  
  protected crearMovimiento(
    n_uno: string,
    n_dos: string,
    n_tres: string,
    debe: number,
    haber: number,
    descripcion: string
  ) {
    return {
      client_id: this.config.clientId,
      fecha_de_registro: new Date().toISOString().split('T')[0],
      libro: 'diario' as const,
      n_uno,
      n_dos,
      n_tres,
      debe,
      haber,
      descripcion
    };
  }
}