#!/usr/bin/env node
// prompts/*.md 内で参照している関数名 (例: requireApp, getAdminSupabase) が
// src/index.ts または src/client.ts で実際に export されているか検証する。
//
// 目的: SDK API と AI 向け説明文の drift を CI で検知する。
//
// 使い方: node scripts/check-prompts.mjs

import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT       = join(dirname(fileURLToPath(import.meta.url)), '..')
const PROMPT_DIR = join(ROOT, 'prompts')
const SRC_FILES  = [
  join(ROOT, 'src', 'index.ts'),
  join(ROOT, 'src', 'client.ts'),
]

// 検査対象とみなす識別子の prefix。SDK の命名規則 (requireXxx / createXxx /
// getXxx / notify) に合致するもののみチェックする。これにより一般語 (例: data,
// foo) を誤検出しない。
const TARGET_RE = /\b((?:require|create|get|notify)[A-Z][A-Za-z0-9]*)\b/g

async function extractExportedNames(file) {
  const src   = await readFile(file, 'utf-8')
  const names = new Set()
  // export function foo(
  for (const m of src.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g)) names.add(m[1])
  // export const foo =
  for (const m of src.matchAll(/export\s+(?:const|let|var)\s+([A-Za-z0-9_]+)/g)) names.add(m[1])
  // export { foo, bar as baz }
  for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim()
      if (name) names.add(name)
    }
  }
  return names
}

async function main() {
  const exported = new Set()
  for (const f of SRC_FILES) {
    for (const n of await extractExportedNames(f)) exported.add(n)
  }

  let files = []
  try {
    files = (await readdir(PROMPT_DIR)).filter((f) => f.endsWith('.md'))
  } catch {
    console.log('[check-prompts] prompts/ ディレクトリが無いのでスキップ')
    process.exit(0)
  }

  const missing = [] // { file, name, line }
  for (const f of files) {
    const text  = await readFile(join(PROMPT_DIR, f), 'utf-8')
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      for (const m of lines[i].matchAll(TARGET_RE)) {
        const name = m[1]
        if (!exported.has(name)) missing.push({ file: f, name, line: i + 1 })
      }
    }
  }

  if (missing.length === 0) {
    console.log(`[check-prompts] OK — ${files.length} prompt(s), ${exported.size} export(s) verified`)
    return
  }

  console.error('[check-prompts] FAIL — SDK で export されていない識別子が prompts に含まれます:')
  for (const { file, name, line } of missing) {
    console.error(`  prompts/${file}:${line}  ${name}`)
  }
  console.error('')
  console.error('対応: prompts/ を実際の SDK export に合わせて更新するか、SDK に該当関数を追加してください。')
  process.exit(1)
}

main().catch((err) => {
  console.error('[check-prompts] 実行エラー:', err)
  process.exit(1)
})
