// CFDI Types
export interface CFDIData {
  folio_fiscal: string;
  ejercicio: string;
  periodo: string;
  fecha_expedicion: string;
  fecha_certificacion: string;
  fecha_pago: string;
  uso_de_cfdi: string;
  pac: string;
  version: string;
  folio: string;
  serie: string;
  tipo_de_comprobante: TipoComprobante;
  moneda: string;
  subtotal: number;
  total: number;
  lugar_expedicion: string;
  forma_de_pago: string;
  metodo_de_pago: MetodoPago;
  exportacion: string;
}

export type TipoComprobante = 'I' | 'E' | 'P' | 'N' | 'T';
export type MetodoPago = 'PUE' | 'PPD' | string;

// Datos de entidades
export interface Entidad {
  nombre: string;
  rfc: string;
  regimen_fiscal: string;
  lugar_expedicion?: string;
  lugar_recepcion?: string;
}

// Movimientos contables
export interface Movimiento {
  client_id: number;
  fecha_de_registro: string;
  libro: 'diario' | 'mayor';
  n_uno: string;
  n_dos: string;
  n_tres: string;
  debe: number;
  haber: number;
  descripcion: string;
}

export interface SeccionContable {
  CARGOS: Movimiento[];
  ABONOS: Movimiento[];
  RETENCIONES?: Movimiento[];
}

// Resultado final
export interface ResultadoContable {
  CFDI: CFDIData;
  CLIENTE: Entidad & { client_id: number };
  PROVEEDOR: Entidad;
  DEVENGACION?: SeccionContable;
  REALIZACION?: SeccionContable;
}

// Configuración
export interface ConfigProcesamiento {
  clientId: number;
  miRFC: string;
  regimenFiscal: string;
  cuentasConfig?: Record<string, string>;
}