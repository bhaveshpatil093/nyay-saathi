/**
 * Web Crypto utilities for NyaySaathi
 * 
 * - PBKDF2 salted hash for 4-6 digit PIN (never stored in plaintext)
 * - AES-GCM encryption & decryption for passphrase-protected JSON backups
 * - Pure browser Web Crypto API (no external libraries)
 */

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Hash a 4-6 digit PIN with PBKDF2 (SHA-256, 100,000 iterations) and 16-byte cryptographic salt
 */
export async function hashPin(
  pin: string,
  saltHex?: string
): Promise<{ hashHex: string; saltHex: string }> {
  const encoder = new TextEncoder();
  const pinBuffer = encoder.encode(pin.trim());

  let salt: Uint8Array;
  if (saltHex) {
    salt = hexToBytes(saltHex);
  } else {
    salt = crypto.getRandomValues(new Uint8Array(16));
  }

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );


  return {
    hashHex: bytesToHex(new Uint8Array(derivedBits)),
    saltHex: bytesToHex(salt),
  };
}

/**
 * Verify an entered PIN against stored salt and hash
 */
export async function verifyPin(
  pin: string,
  storedHashHex: string,
  saltHex: string
): Promise<boolean> {
  try {
    const { hashHex } = await hashPin(pin, saltHex);
    return hashHex === storedHashHex;
  } catch (err) {
    console.error('[WebCrypto] verifyPin error:', err);
    return false;
  }
}

/**
 * Encrypt arbitrary JSON backup string with AES-GCM (256-bit key derived via PBKDF2)
 */
export async function encryptBackupData(
  jsonString: string,
  passphrase: string
): Promise<{
  saltBase64: string;
  ivBase64: string;
  ciphertextBase64: string;
}> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(jsonString)
  );

  return {
    saltBase64: bytesToBase64(salt),
    ivBase64: bytesToBase64(iv),
    ciphertextBase64: bytesToBase64(new Uint8Array(encryptedBuffer)),
  };
}

/**
 * Decrypt AES-GCM encrypted backup data using passphrase
 */
export async function decryptBackupData(
  ciphertextBase64: string,
  passphrase: string,
  saltBase64: string,
  ivBase64: string
): Promise<string> {
  const salt = base64ToBytes(saltBase64);
  const iv = base64ToBytes(ivBase64);
  const ciphertext = base64ToBytes(ciphertextBase64);
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ciphertext as unknown as BufferSource
  );

  return new TextDecoder().decode(decryptedBuffer);

}
