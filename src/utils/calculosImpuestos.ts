// src/utils/calculosImpuestos.ts

/**
 * Calcula el total de IVA trasladado (Impuesto 002) con TipoFactor "Tasa"
 * @param impuestosData - Objeto con estructura de impuestos del XML parseado
 * @returns Total de IVA trasladado
 */
export function calcularIVATrasladado(impuestosData: any): number {
    let totalIVA = 0;
    
    // Caso 1: Impuestos en nivel comprobante (nodo principal)
    if (impuestosData && impuestosData.traslados) {
        const traslados = Array.isArray(impuestosData.traslados) 
            ? impuestosData.traslados 
            : [impuestosData.traslados];
            
        totalIVA += traslados
            .filter((traslado: any) => 
                traslado['@_Impuesto'] === '002' && 
                traslado['@_TipoFactor'] === 'Tasa'
            )
            .reduce((sum: number, traslado: any) => 
                sum + parseFloat(traslado['@_Importe'] || 0), 0);
    }
    
    // Caso 2: Impuestos en nivel concepto (dentro de cada concepto)
    if (impuestosData && impuestosData.conceptosImpuestos) {
        impuestosData.conceptosImpuestos.forEach((conceptoImpuestos: any) => {
            if (conceptoImpuestos.traslados) {
                const traslados = Array.isArray(conceptoImpuestos.traslados) 
                    ? conceptoImpuestos.traslados 
                    : [conceptoImpuestos.traslados];
                    
                totalIVA += traslados
                    .filter((traslado: any) => 
                        traslado['@_Impuesto'] === '002' && 
                        traslado['@_TipoFactor'] === 'Tasa'
                    )
                    .reduce((sum: number, traslado: any) => 
                        sum + parseFloat(traslado['@_Importe'] || 0), 0);
            }
        });
    }
    
    // Redondear a 2 decimales (como el SAT)
    return Math.round(totalIVA * 100) / 100;
}

/**
 * Calcula el total de ISR retenido (Impuesto 001)
 */
export function calcularISRRetenido(impuestosData: any): number {
    return calcularImpuestoRetenido(impuestosData, '001');
}

/**
 * Calcula el total de IVA retenido (Impuesto 002 como retención)
 */
export function calcularIVARetenido(impuestosData: any): number {
    return calcularImpuestoRetenido(impuestosData, '002');
}

/**
 * Función genérica para calcular retenciones
 */
function calcularImpuestoRetenido(impuestosData: any, impuestoCodigo: string): number {
    let total = 0;
    
    if (impuestosData && impuestosData.retenciones) {
        const retenciones = Array.isArray(impuestosData.retenciones) 
            ? impuestosData.retenciones 
            : [impuestosData.retenciones];
            
        total += retenciones
            .filter((retencion: any) => retencion['@_Impuesto'] === impuestoCodigo)
            .reduce((sum: number, retencion: any) => 
                sum + parseFloat(retencion['@_Importe'] || 0), 0);
    }
    
    return Math.round(total * 100) / 100;
}

/**
 * Obtiene todos los impuestos trasladados agrupados por tipo
 */
export function obtenerImpuestosTrasladados(impuestosData: any): Array<{
    impuesto: string;
    tipoFactor: string;
    tasaOCuota: number;
    importe: number;
    base: number;
}> {
    const resultado: any[] = [];
    
    if (impuestosData && impuestosData.traslados) {
        const traslados = Array.isArray(impuestosData.traslados) 
            ? impuestosData.traslados 
            : [impuestosData.traslados];
            
        traslados.forEach((traslado: any) => {
            resultado.push({
                impuesto: traslado['@_Impuesto'] || '',
                tipoFactor: traslado['@_TipoFactor'] || '',
                tasaOCuota: parseFloat(traslado['@_TasaOCuota'] || 0),
                importe: parseFloat(traslado['@_Importe'] || 0),
                base: parseFloat(traslado['@_Base'] || 0)
            });
        });
    }
    
    return resultado;
}