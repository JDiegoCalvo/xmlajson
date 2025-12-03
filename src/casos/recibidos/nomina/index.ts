export class NominaRecibida extends BaseProcessor {
  static readonly tipo = 'N' as const;
  static readonly descripcion = 'Nómina recibida (como empleado)';

  async procesar(xmlData: any): Promise<ResultadoContable> {
    // Lógica específica para nóminas recibidas
    // Incluye percepciones, deducciones, etc.
    throw new Error('Por implementar: NominaRecibida');
  }
}

export { NominaRecibida };