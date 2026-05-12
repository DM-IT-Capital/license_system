import { customAlphabet } from 'nanoid'
import CryptoJS from 'crypto-js'

// License key format: XXXX-XXXX-XXXX-XXXX (alphanumeric, uppercase)
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const nanoid = customAlphabet(alphabet, 4)

export function generateLicenseKey(): string {
  return `${nanoid()}-${nanoid()}-${nanoid()}-${nanoid()}`
}

// Secret key for offline signature (should be stored in env in production)
const SIGNATURE_SECRET = process.env.LICENSE_SIGNATURE_SECRET || 'your-secret-key-here'

export interface OfflineLicenseData {
  licenseKey: string
  productSlug: string
  tierSlug: string
  expiresAt: string | null
  maxActivations: number
  features: string[]
  issuedAt: string
}

export function generateOfflineSignature(data: OfflineLicenseData): string {
  const payload = JSON.stringify(data)
  const signature = CryptoJS.HmacSHA256(payload, SIGNATURE_SECRET).toString(CryptoJS.enc.Base64)
  return signature
}

export function verifyOfflineSignature(data: OfflineLicenseData, signature: string): boolean {
  const expectedSignature = generateOfflineSignature(data)
  return signature === expectedSignature
}

export function createOfflineLicensePackage(data: OfflineLicenseData): string {
  const signature = generateOfflineSignature(data)
  const package_ = {
    ...data,
    signature
  }
  return Buffer.from(JSON.stringify(package_)).toString('base64')
}

export function parseOfflineLicensePackage(packageString: string): { data: OfflineLicenseData; valid: boolean } | null {
  try {
    const decoded = Buffer.from(packageString, 'base64').toString('utf-8')
    const { signature, ...data } = JSON.parse(decoded)
    const valid = verifyOfflineSignature(data as OfflineLicenseData, signature)
    return { data: data as OfflineLicenseData, valid }
  } catch {
    return null
  }
}

export function formatLicenseKey(key: string): string {
  // Ensure proper formatting with dashes
  const clean = key.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  const parts = clean.match(/.{1,4}/g) || []
  return parts.slice(0, 4).join('-')
}

export function isLicenseExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

export function getLicenseStatus(
  status: string,
  expiresAt: string | null
): 'active' | 'suspended' | 'expired' | 'revoked' {
  if (status === 'revoked') return 'revoked'
  if (status === 'suspended') return 'suspended'
  if (isLicenseExpired(expiresAt)) return 'expired'
  return 'active'
}
