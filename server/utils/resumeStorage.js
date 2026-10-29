import { randomUUID } from 'node:crypto'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const defaultStorageDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'private_uploads',
)

function resumePath(storageKey) {
  if (typeof storageKey !== 'string' || !/^[0-9a-f-]{36}$/.test(storageKey)) {
    throw new Error('Resume storage key is invalid.')
  }
  const directory = resolve(process.env.RESUME_STORAGE_DIR || defaultStorageDirectory)
  return join(directory, `${storageKey}.pdf`)
}

async function storeResume(buffer) {
  const storageKey = randomUUID()
  const filepath = resumePath(storageKey)
  await mkdir(dirname(filepath), { recursive: true })
  await writeFile(filepath, buffer, { flag: 'wx', mode: 0o600 })
  return { storageKey, filepath }
}

async function readResume(storageKey) {
  return readFile(resumePath(storageKey))
}

async function removeResume(storageKey) {
  try {
    await unlink(resumePath(storageKey))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

export { readResume, removeResume, storeResume }
