#!/usr/bin/env node
/**
 * Guardia de CI — Sistema de estilos (Fase 1)
 *
 * Falla si:
 *  1. Aparece una clase con valor crudo `-oklch(` en componentes/páginas.
 *  2. Se usa un token semántico de color que no está definido en app/globals.css.
 *  3. Vuelve a aparecer un @import remoto de Google Fonts (debe usarse next/font).
 *
 * Uso: node scripts/check-design-tokens.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CSS_FILE = join(ROOT, 'app/globals.css');
const SCAN_DIRS = ['components', 'app'];
const EXTS = ['.tsx', '.ts', '.jsx', '.js', '.css'];

const errors = [];

// ---------- 1. Recoger archivos fuente ----------
function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry === '.next') continue;
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (EXTS.some((e) => entry.endsWith(e))) yield full;
  }
}

const files = [];
for (const d of SCAN_DIRS) {
  const full = join(ROOT, d);
  if (existsSync(full)) files.push(...walk(full));
}

// ---------- 2. Tokens definidos en globals.css ----------
const css = readFileSync(CSS_FILE, 'utf8');
const definedTokens = new Set(
  [...css.matchAll(/--color-([a-z0-9-]+)\s*:/g)].map((m) => m[1])
);

if (definedTokens.size === 0) {
  console.error('✗ No se encontró ningún token --color-* en app/globals.css');
  process.exit(1);
}

// Tokens semánticos mínimos que los componentes ui/ requieren:
const REQUIRED_TOKENS = [
  'background', 'foreground', 'muted', 'muted-foreground', 'border',
  'input', 'ring', 'destructive', 'card', 'card-foreground',
  'popover', 'popover-foreground', 'primary', 'primary-foreground',
  'secondary', 'secondary-foreground', 'accent', 'accent-foreground',
  'destructive-foreground',
];
for (const t of REQUIRED_TOKENS) {
  if (!definedTokens.has(t)) {
    errors.push(`app/globals.css: token requerido no definido → --color-${t}`);
  }
}

// Escalas numéricas permitidas (primary-N, accent-N, neutral-N y paletas core de Tailwind)
const SCALE_RE = /^(primary|accent|neutral)-\d{2,3}$/;
// Paletas por defecto de Tailwind v4 (siempre disponibles):
const CORE_PALETTES = /^(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}$/;
// Utilidades de color que resuelven contra --color-*
const UTIL_RE = /\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|decoration|shadow|accent|caret|divide|placeholder)-(foreground|background|card|popover|primary|secondary|muted|accent|destructive|input|border|ring)(?:\/[\w.]+)?\b/g;

// ---------- 3. Chequeo de archivos ----------
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const rel = file.slice(ROOT.length + 1);
  const lines = src.split('\n');

  lines.forEach((line, i) => {
    // 3a. oklch crudo
    if (/-oklch\(/.test(line)) {
      errors.push(`${rel}:${i + 1}: clase con color crudo "-oklch(" encontrada → usar token`);
    }
    // 3b. @import de Google Fonts
    if (/@import\s+url\(['"]?https:\/\/fonts\.googleapis\.com/.test(line)) {
      errors.push(`${rel}:${i + 1}: @import de Google Fonts → usar next/font en app/layout.tsx`);
    }
    // 3c. tokens semánticos usados pero no definidos
    for (const m of line.matchAll(UTIL_RE)) {
      const token = m[1];
      if (!definedTokens.has(token)) {
        errors.push(`${rel}:${i + 1}: token no definido en @theme → "${m[0]}" (--color-${token} falta)`);
      }
    }
  });

  // 3d. clases de escala numérica personalizada inexistentes (primary-N/accent-N fuera de rango)
  for (const m of src.matchAll(/\b(?:bg|text|border|ring|from|to)-(primary|accent|neutral)-(\d{2,3})\b/g)) {
    const token = `${m[1]}-${m[2]}`;
    if (!definedTokens.has(token)) {
      errors.push(`${rel}: escala no definida → --color-${token} no existe en @theme (usa 50..950)`);
    }
  }
}

// ---------- 4. Resultado ----------
if (errors.length) {
  console.error('✗ check-design-tokens: se encontraron problemas de estilos:\n');
  for (const e of [...new Set(errors)]) console.error('  ' + e);
  console.error(`\n  Total: ${new Set(errors).size} problema(s).`);
  process.exit(1);
}
console.log('✓ check-design-tokens: sin oklch crudo, todos los tokens están definidos.');
