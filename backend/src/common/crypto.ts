import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

/**
 * Cifrado simétrico AES-256-GCM para secretos en reposo
 * (contraseñas del PSE, contraseña del certificado digital, etc.).
 *
 * La clave deriva de la variable de entorno FISCAL_SECRETS_KEY mediante scrypt.
 * Formato almacenado: enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
 */

const PREFIX = 'enc:v1:';

function getKey(): Buffer {
  const secret = process.env.FISCAL_SECRETS_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'FISCAL_SECRETS_KEY (o JWT_SECRET como respaldo) no está definida; no es posible cifrar secretos fiscales.',
    );
  }
  // Derivación determinista de 32 bytes para AES-256
  return scryptSync(secret, 'bodega-fiscal-secrets', 32);
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${ciphertext.toString('hex')}`;
}

export function decryptSecret(stored: string): string {
  if (!stored) return stored;
  if (!isEncrypted(stored)) {
    // Valor heredado guardado en texto plano antes de introducir el cifrado:
    // se devuelve tal cual (el servicio lo re-cifrará de forma transparente al leer).
    return stored;
  }
  const [ivHex, tagHex, dataHex] = stored.slice(PREFIX.length).split(':');
  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

/** Enmascara un secreto para mostrarlo en lecturas seguras. */
export function maskSecret(stored?: string | null): string | null {
  if (!stored) return stored ?? null;
  let value = stored;
  try {
    value = decryptSecret(stored);
  } catch {
    // si no se puede descifrar (clave rotada), igual no debe exponerse
    return '••••••••';
  }
  return value ? '••••••••' : null;
}
