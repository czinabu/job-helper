// Copies the screenshot reader (Tesseract OCR worker, engine, and English data)
// from node_modules into public/tesseract, so the browser loads it from this
// site. The default CDN is blocked by the Content-Security-Policy in
// next.config.ts. Runs before `dev` and `build`; the output is git-ignored.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "tesseract");
const pkgDir = (name) => dirname(require.resolve(`${name}/package.json`));

const tesseract = pkgDir("tesseract.js");
const core = pkgDir("tesseract.js-core");
const eng = pkgDir("@tesseract.js-data/eng");

const files = [
  [join(tesseract, "dist", "worker.min.js"), "worker.min.js"],
  // The worker picks one of these by browser support (LSTM-only engine mode).
  ...["", "-simd", "-relaxedsimd"].map((v) => [
    join(core, `tesseract-core${v}-lstm.wasm.js`),
    `core/tesseract-core${v}-lstm.wasm.js`,
  ]),
  [join(eng, "4.0.0_best_int", "eng.traineddata.gz"), "lang/eng.traineddata.gz"],
];

for (const [from, to] of files) {
  const dest = join(out, to);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(from, dest);
}
console.log(`Copied ${files.length} OCR files to public/tesseract`);
