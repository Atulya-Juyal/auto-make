import { app, ipcMain, safeStorage } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'

type SecretsPayload = {
  apiKey?: string
}

const SECRETS_FILE = 'secrets.json'

function secretsFilePath(): string {
  return path.join(app.getPath('userData'), SECRETS_FILE)
}

async function readSecrets(): Promise<SecretsPayload> {
  const p = secretsFilePath()
  try {
    const raw = await fs.readFile(p, 'utf-8')
    const parsed = JSON.parse(raw) as SecretsPayload
    return parsed ?? {}
  } catch {
    return {}
  }
}

async function writeSecrets(payload: SecretsPayload): Promise<void> {
  const p = secretsFilePath()
  await fs.mkdir(path.dirname(p), { recursive: true })
  await fs.writeFile(p, JSON.stringify(payload, null, 2), 'utf-8')
}

export async function getApiKeyFromSecureStorage(): Promise<string> {
  if (!safeStorage.isEncryptionAvailable()) return ''
  const secrets = await readSecrets()
  const stored = secrets.apiKey
  if (!stored) return ''
  try {
    return safeStorage.decryptString(Buffer.from(stored, 'base64')).trim()
  } catch {
    return ''
  }
}

export function setupSecretsHandlers(): void {
  ipcMain.removeHandler('secrets.getApiKey')
  ipcMain.removeHandler('secrets.setApiKey')
  ipcMain.removeHandler('secrets.hasApiKey')
  ipcMain.removeHandler('secrets.isSecureStorageAvailable')

  ipcMain.handle('secrets.isSecureStorageAvailable', () => safeStorage.isEncryptionAvailable())

  ipcMain.handle('secrets.getApiKey', async () => {
    return await getApiKeyFromSecureStorage()
  })

  ipcMain.handle('secrets.setApiKey', async (_event, key: string) => {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Secure storage is unavailable on this system.')
    }
    const trimmed = key.trim()
    const enc = safeStorage.encryptString(trimmed).toString('base64')
    const prev = await readSecrets()
    await writeSecrets({ ...prev, apiKey: enc })
  })

  ipcMain.handle('secrets.hasApiKey', async () => {
    if (!safeStorage.isEncryptionAvailable()) return false
    const secrets = await readSecrets()
    return Boolean(secrets.apiKey)
  })
}
