// src/utils/calculosImpuestos.ts - Versión super simple

/**
 * Calcula el total de IVA trasladado (Impuesto 002) con TipoFactor "Tasa"
 */
export function calcularIVATrasladado(xmlData: any): number {
    if (!xmlData.impuestos || !Array.isArray(xmlData.impuestos)) return 0;
    
    const totalIVA = xmlData.impuestos
        .filter((impuesto: any) => 
            impuesto.tipo === 'traslado' &&
            impuesto.impuesto === '002' && 
            impuesto.tipoFactor === 'Tasa'
        )
        .reduce((sum: number, impuesto: any) => 
            sum + (impuesto.importe || 0), 0);
    
    console.log('IVA Trasladado calculado:', totalIVA);
    return Math.round(totalIVA * 100) / 100;
}

/**
 * Calcula el total de ISR retenido (Impuesto 001)
 */
export function calcularISRRetenido(xmlData: any): number {
    if (!xmlData.impuestos || !Array.isArray(xmlData.impuestos)) return 0;
    
    const totalISR = xmlData.impuestos
        .filter((impuesto: any) => 
            impuesto.tipo === 'retencion' &&
            impuesto.impuesto === '001'
        )
        .reduce((sum: number, impuesto: any) => 
            sum + (impuesto.importe || 0), 0);
    
    console.log('ISR Retenido calculado:', totalISR);
    return Math.round(totalISR * 100) / 100;
}

/**
 * Calcula el total de IVA retenido (Impuesto 002 como retención)
 */
export function calcularIVARetenido(xmlData: any): number {
    if (!xmlData.impuestos || !Array.isArray(xmlData.impuestos)) return 0;
    
    const totalIVA = xmlData.impuestos
        .filter((impuesto: any) => 
            impuesto.tipo === 'retencion' &&
            impuesto.impuesto === '002'
        )
        .reduce((sum: number, impuesto: any) => 
            sum + (impuesto.importe || 0), 0);
    
    console.log('IVA Retenido calculado:', totalIVA);
    return Math.round(totalIVA * 100) / 100;
}

/**
 * Obtiene todos los impuestos trasladados (para referencia)
 */
export function obtenerImpuestosTrasladados(xmlData: any): Array<{
    impuesto: string;
    tipoFactor: string;
    tasaOCuota: number;
    importe: number;
    base: number;
}> {
    if (!xmlData.impuestos || !Array.isArray(xmlData.impuestos)) return [];
    
    return xmlData.impuestos
        .filter((impuesto: any) => impuesto.tipo === 'traslado')
        .map((impuesto: any) => ({
            impuesto: impuesto.impuesto,
            tipoFactor: impuesto.tipoFactor,
            tasaOCuota: impuesto.tasa,
            importe: impuesto.importe,
            base: impuesto.base
        }));
}