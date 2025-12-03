// Para nómina recibida o notas de crédito de proveedores
export class EgresoRecibido extends BaseProcessor {
  static readonly tipo = 'E' as const;
  static readonly descripcion = 'Nota de crédito recibida';

  async procesar(xmlData: any): Promise<ResultadoContable> {
    // Lógica similar a IngresoPPDRecibido pero con cuentas invertidas
    // Depende de si es PUE o PPD
    throw new Error('Por implementar: EgresoRecibido');
  }
}

export { EgresoRecibido };