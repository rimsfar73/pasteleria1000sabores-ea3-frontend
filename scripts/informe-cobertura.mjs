// Reporte factual: requiere ejecutar npm run test:coverage en ESTA versión.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, 'coverage/coverage-summary.json');
if (!existsSync(file)) {
  console.error('No existe cobertura actual. Ejecuta primero: npm run test:coverage');
  process.exit(2);
}
const data = JSON.parse(readFileSync(file, 'utf8'));
const tot = data.total;
if (!tot || !['statements','branches','functions','lines'].every(k=>tot[k]?.pct !== undefined)) {
  console.error('El reporte de Karma no contiene los totales esperados. Revisar coverage-summary.json');
  process.exit(2);
}
const today = new Date().toISOString().slice(0,10);
const team = ['Christian Quiroz Roa','Rimsky Farías Soto'];
const md = `# Informe de cobertura frontend EA3 — ${today}

`+
`**Integrantes:** ${team.join(' · ')}

`+
`**Fuente:** frontend/coverage/coverage-summary.json, generado por npm run test:coverage sobre el código actual.

`+
`| Métrica | Porcentaje |
|---|---:|
`+
[['Sentencias','statements'],['Ramas','branches'],['Funciones','functions'],['Líneas','lines']]
 .map(([label,key])=>`| ${label} | ${tot[key].pct.toFixed(2)}% |`).join('\n')+
`

## Referencia histórica EA2 (no sustituye estas mediciones)
`+
`- Encargo EA2: 132 pruebas aprobadas, 58,9% de sentencias, 54,4% de ramas, según retroalimentación del docente del 19/11/2026.
`+
`- No inferir cumplimiento de EA3 a partir de cantidades de tests o de capturas antiguas.
`+
`
## Evidencias para entregar
`+
`- Comando de prueba, salida de Karma, reporte html, captura del navegador, versión/commit Git y responsables.
`+
`- Para Backend, generar por separado JaCoCo con Maven.
`;
const dest=resolve(root,'docs/INFORME_COBERTURA_EA3_GENERADO.md');
const docsDir = resolve(root, 'docs');

mkdirSync(docsDir, { recursive: true });
writeFileSync(dest, md, 'utf8');

console.log(md);
console.log(`Informe generado en: ${dest}`);