export class PagoRecibido extends BaseProcessor {
  static readonly tipo = 'P' as const;
  static readonly descripcion = 'Complemento de pago recibido';

  async procesar(xmlData: any): Promise<ResultadoContable> {
    // Cuando un cliente me paga (aplica para facturas I+PPD)
    // Incluye registro de retenciones aplicadas
    throw new Error('Por implementar: PagoRecibido');
  }
}

export { PagoRecibido };