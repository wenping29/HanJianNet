import CryptoJS from 'crypto-js'

/** 系统配置 Key：Web/Admin 与 WebApi 通讯是否启用加密（true/false） */
export const ENCRYPTION_CONFIG_KEY = 'web.api.encryptionEnabled'

/** 通讯加密共享密钥：Base64 编码的 16/24/32 字节 AES 密钥，需与后端 Security:EncryptionKey 保持一致 */
const KEY_B64: string = (import.meta.env.VITE_API_ENCRYPTION_KEY as string | undefined) ?? ''

// 配置了共享密钥即默认启用加密，避免首屏配置返回前的那批请求走明文；
// 数据库 web.api.encryptionEnabled 仅作为“强制关闭”开关（false 时关闭）。
let enabled = true

export function setCryptoEnabled(v: boolean): void {
  enabled = v
}

export function getCryptoEnabled(): boolean {
  return enabled
}

/** 是否已配置可用的共享密钥 */
export function hasCryptoKey(): boolean {
  return keyBytes !== null
}

function base64ToBytes(b64: string): Uint8Array | null {
  try {
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

const keyBytes = (() => {
  const kb = base64ToBytes(KEY_B64)
  return kb && (kb.length === 16 || kb.length === 24 || kb.length === 32) ? kb : null
})()

/** Web Crypto（AES-GCM）仅在安全上下文（HTTPS/localhost）可用，其余环境兜底 crypto-js AES-CBC */
function supportsWebCrypto(): boolean {
  return typeof globalThis !== 'undefined' && !!globalThis.crypto && !!globalThis.crypto.subtle
}

/** 当前环境下使用的加密算法，需随 X-Crypto-Alg 头告知服务端 */
export function encryptionAlg(): 'gcm' | 'cbc' {
  return supportsWebCrypto() ? 'gcm' : 'cbc'
}

/** 加密请求体（JSON 字符串），返回信封 JSON */
export async function encryptRequest(json: string): Promise<string> {
  if (!hasCryptoKey()) throw new Error('未配置通讯加密密钥（VITE_API_ENCRYPTION_KEY）')

  if (supportsWebCrypto()) {
    const key = await globalThis.crypto.subtle.importKey('raw', keyBytes!, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))
    const ct = new Uint8Array(await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(json)))
    return JSON.stringify({ v: 1, alg: 'gcm', iv: bytesToBase64(iv), data: bytesToBase64(ct) })
  }

  const key = CryptoJS.enc.Base64.parse(KEY_B64)
  const iv = CryptoJS.lib.WordArray.random(16)
  const cipher = CryptoJS.AES.encrypt(json, key, { iv })
  return JSON.stringify({ v: 1, alg: 'cbc', iv: iv.toString(CryptoJS.enc.Base64), data: cipher.ciphertext.toString(CryptoJS.enc.Base64) })
}

/** 解密响应文本（信封 JSON），返回明文 JSON 字符串 */
export async function decryptResponse(text: string): Promise<string> {
  const env = JSON.parse(text) as { v?: number; alg?: string; iv?: string; data?: string }
  if (!env || !env.iv || !env.data) throw new Error('加密信封格式错误')

  const alg = (env.alg ?? 'gcm').toLowerCase()
  if (alg === 'cbc') {
    if (!hasCryptoKey()) throw new Error('未配置通讯加密密钥（VITE_API_ENCRYPTION_KEY）')
    const key = CryptoJS.enc.Base64.parse(KEY_B64)
    const iv = CryptoJS.enc.Base64.parse(env.iv)
    const ct = CryptoJS.enc.Base64.parse(env.data)
    const plain = CryptoJS.AES.decrypt(CryptoJS.lib.CipherParams.create({ ciphertext: ct }), key, { iv })
    return plain.toString(CryptoJS.enc.Utf8)
  }

  if (!supportsWebCrypto()) throw new Error('当前环境不支持 AES-GCM 解密')
  const key = await globalThis.crypto.subtle.importKey('raw', keyBytes!, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
  const iv = base64ToBytes(env.iv)!
  const data = base64ToBytes(env.data)!
  const plain = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new TextDecoder().decode(plain)
}