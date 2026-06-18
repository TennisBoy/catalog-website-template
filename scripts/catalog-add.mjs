#!/usr/bin/env node
import { readFile, writeFile, mkdir, rename, copyFile, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { draftToItem, appendItems, toDonePath } from './lib/catalogWrite.mjs'

const REPO = resolve(process.cwd())
const CATALOG = resolve(REPO, 'public/catalog.json')

async function readJson(path, fallback) {
  try {
    const txt = await readFile(path, 'utf8')
    const v = JSON.parse(txt)
    return v
  } catch {
    return fallback
  }
}

async function moveToDone(sourceImage) {
  const from = resolve(REPO, sourceImage)
  const to = resolve(REPO, toDonePath(sourceImage))
  if (!existsSync(from)) return false
  await mkdir(dirname(to), { recursive: true })
  await copyFile(from, to) // Copy instead of move/rename to preserve original files in catalog-inbox/
  return true
}

async function appendRunLog(entries) {
  const date = new Date().toISOString().slice(0, 10)
  const logPath = resolve(REPO, `catalog-inbox/_runs/${date}.md`)
  await mkdir(dirname(logPath), { recursive: true })
  const stamp = new Date().toISOString()
  const lines = entries.map(
    (e) => `- ${stamp}: \`${e.sourceImage}\` → **${e.title}** (${e.isbn || 'no ISBN'}) [${e.category}] id=${e.id}`,
  )
  const header = existsSync(logPath) ? '' : `# Cataloging run log ${date}\n\n`
  await writeFile(logPath, header + lines.join('\n') + '\n', { flag: 'a' })
}

async function main() {
  const draftsPath = process.argv[2]
  if (!draftsPath) {
    console.error('usage: node scripts/catalog-add.mjs <drafts.json>')
    process.exit(2)
  }
  const drafts = await readJson(resolve(process.cwd(), draftsPath), null)
  if (!Array.isArray(drafts) || drafts.length === 0) {
    console.error('drafts file must be a non-empty JSON array')
    process.exit(2)
  }

  const existing = await readJson(CATALOG, [])
  const base = Array.isArray(existing) ? existing : []
  const ts = new Date().toISOString()

  const newItems = []
  const logEntries = []
  for (const d of drafts) {
    const id = randomUUID()
    newItems.push(draftToItem(d, { id, ts }))
    logEntries.push({ sourceImage: d.sourceImage, title: d.title, isbn: d.isbn, category: d.category, id })
  }

  const merged = appendItems(base, newItems)
  const tmp = CATALOG + '.tmp'
  await writeFile(tmp, JSON.stringify(merged, null, 2) + '\n', 'utf8')
  await rename(tmp, CATALOG)

  const missing = []
  for (const d of drafts) {
    if (d.sourceImage) {
      const moved = await moveToDone(d.sourceImage)
      if (!moved) {
        console.warn(`warning: source image not found, not moved: ${d.sourceImage}`)
        missing.push(d.sourceImage)
      }
    } else {
      console.warn(`warning: draft has no source image, nothing to move: ${d.title}`)
      missing.push(d.sourceImage ?? `(no sourceImage: ${d.title})`)
    }
  }
  await appendRunLog(logEntries)

  console.log(
    JSON.stringify({ added: newItems.length, ids: newItems.map((i) => i.id), titles: newItems.map((i) => i.title), missing }),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
