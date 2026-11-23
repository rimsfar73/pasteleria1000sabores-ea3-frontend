/** Puerta de calidad: NO modifica métricas ni ignora archivos de producción.
 * Requiere cobertura generada sobre el frontend ACTUAL por npm run test:coverage.
 * Cada métrica global debe alcanzar 80% o el proceso termina con código distinto de cero.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const archivo = resolve(root, 'coverage/coverage-summary.json');
const minimo = 80;
const nombres = { statements: 'Sentencias', branches: 'Ramas', functions: 'Funciones', lines: 'Líneas' };
if (!existsSync(archivo)) {
  console.error('SIN RESULTADO. Ejecuta primero: npm run test:coverage');
  process.exit(2);
}
let resumen;
try { resumen = JSON.parse(readFileSync(archivo, 'utf8')).total; }
catch (error) { console.error('REPORTE INVÁLIDO:', error.message); process.exit(2); }
if (!resumen || Object.keys(nombres).some(m => !Number.isFinite(Number(resumen[m]?.pct)))) {
  console.error('REPORTE INCOMPLETO: no hay datos de las cuatro métricas.');
  process.exit(2);
}
const fallos=[];
console.log('\nCONTROL DE COBERTURA REAL · FRONTEND EA3');
for (const [id, nombre] of Object.entries(nombres)) {
  const m=resumen[id], pct=Number(m.pct), pasa=pct>=minimo;
  console.log(`${pasa?'APROBADO':'NO CUMPLE'} | ${nombre.padEnd(11)} | ${pct.toFixed(2).padStart(6)}% | ${m.covered}/${m.total} | Mínimo ${minimo}%`);
  if(!pasa)fallos.push(nombre);
}
if(fallos.length){
  console.error(`\nNO APTO PARA DECLARAR >=80%: mejorar y repetir pruebas (${fallos.join(', ')}).`);
  process.exit(1);
}
console.log('\nAPTO: 80% o más en las cuatro métricas, según Karma/Istanbul de esta ejecución.');
