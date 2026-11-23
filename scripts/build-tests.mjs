import { build } from "esbuild";
import { transformAsync } from "@babel/core";
import { readFile } from "node:fs/promises";
import { readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

function encontrarPruebas(directorio) {
  return readdirSync(directorio, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(directorio, entrada.name);

    if (entrada.isDirectory()) {
      return encontrarPruebas(ruta);
    }

    return /\.spec\.(js|jsx)$/.test(entrada.name) ? [ruta] : [];
  });
}

const pruebas = encontrarPruebas("test");

if (pruebas.length === 0) {
  throw new Error("No se encontraron archivos de pruebas.");
}

const medirCobertura = process.argv.includes("--coverage");
mkdirSync(".karma-tests", { recursive: true });
writeFileSync(".karma-tests/coverage-enabled", String(medirCobertura));

// Incluye también módulos no alcanzados por las pruebas: no infla el porcentaje.
function encontrarFuente(directorio) {
  return readdirSync(directorio, { withFileTypes: true }).flatMap(entrada => {
    const ruta = join(directorio, entrada.name);
    if (entrada.isDirectory()) return encontrarFuente(ruta);
    return /\.(js|jsx)$/.test(entrada.name) && entrada.name !== "main.jsx" ? [ruta] : [];
  });
}

const codigo = [
  'globalThis.IS_REACT_ACT_ENVIRONMENT = true;',
  'import "./test/setup.js";',
  ...(medirCobertura ? encontrarFuente("src").map(ruta => `import "./${ruta.replaceAll("\\", "/")}";`) : []),
  ...pruebas.map((ruta) => `import "./${ruta.replaceAll("\\", "/")}";`),
].join("\n");

await build({
  stdin: {
    contents: codigo,
    resolveDir: resolve("."),
    sourcefile: "test-entry.jsx",
    loader: "jsx",
  },
  bundle: true,
  loader: {
    ".js": "jsx",
    ".jsx": "jsx",
  },
  plugins: medirCobertura
    ? [
        {
          name: "instrumentar-cobertura",
          setup(build) {
            build.onLoad(
              { filter: /src[\\/].*\.(js|jsx)$/ },
              async (args) => {
                const codigoFuente = await readFile(args.path, "utf8");

                const resultado = await transformAsync(codigoFuente, {
                  filename: args.path,
                  babelrc: false,
                  configFile: false,
                  plugins: [
                    "@babel/plugin-syntax-jsx",
                    "babel-plugin-istanbul",
                  ],
                });

                return {
                  contents: resultado.code,
                  loader: args.path.endsWith(".jsx") ? "jsx" : "js",
                };
              }
            );
          },
        },
      ]
    : [],
  outfile: ".karma-tests/bundle.js",
  format: "iife",
  platform: "browser",
  jsx: "automatic",
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify("http://localhost:8080/api/v1"),
    "process.env.NODE_ENV": '"test"',
  },
});

console.log(`${pruebas.length} archivos de pruebas preparados.`);
