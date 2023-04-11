const RSA_ALG = 'RSA-OAEP';
const AES_ALG = 'AES-CBC';

function arrayBufferToBase64(arrayBuffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/* Create CryptoKey from password */
export async function createKeyFromPassword(password: string, saltData: string | null = null) {
  const encoder = new TextEncoder();
  const salt = saltData ?? arrayBufferToBase64(crypto.getRandomValues(new Uint8Array(16)));
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, [
    'deriveBits',
    'deriveKey',
  ]);
  const cryptoKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: base64ToArrayBuffer(salt),
      iterations: 150000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: AES_ALG, length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
  return {
    jwk: await crypto.subtle.exportKey('jwk', cryptoKey),
    salt,
  };
}

/**
 * Generate RSA keys
 * @returns private and public keys in jwk
 */
export async function generateRsaKeys() {
  const { privateKey, publicKey } = await crypto.subtle.generateKey(
    {
      name: RSA_ALG,
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  );

  return {
    privateKey: await crypto.subtle.exportKey('jwk', privateKey),
    publicKey: await crypto.subtle.exportKey('jwk', publicKey),
  };
}

/**
 * Generate AES key
 * @returns AES key in jwk
 */
export async function generateAesKey() {
  const aesKey = await crypto.subtle.generateKey(
    {
      name: AES_ALG,
      length: 256,
    },
    true,
    ['encrypt', 'decrypt'],
  );

  return await crypto.subtle.exportKey('jwk', aesKey);
}

/**
 * Encrypt AES
 * @param aesKey key in jwk
 * @param message data
 */
export async function encryptAes(aesKey: JsonWebKey, message: string) {
  const textEncoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey('jwk', aesKey, AES_ALG, true, ['encrypt']);
  const initialVector = crypto.getRandomValues(new Uint8Array(16));
  const encryptedMessage = await crypto.subtle.encrypt(
    {
      name: AES_ALG,
      iv: initialVector,
    },
    cryptoKey,
    textEncoder.encode(message),
  );
  return {
    base64Data: arrayBufferToBase64(encryptedMessage),
    initialVector: arrayBufferToBase64(initialVector),
  };
}

/**
 * Decrypt AES
 * @param aesKey key in jwk
 * @param encryptedMessage data in base64
 * @param initialVector iv in base64
 */
export async function decryptAes(aesKey: JsonWebKey, encryptedMessage: string, initialVector: string) {
  const textDecoder = new TextDecoder();
  const cryptoKey = await crypto.subtle.importKey('jwk', aesKey, AES_ALG, true, ['decrypt']);
  const arrayBuffer = base64ToArrayBuffer(encryptedMessage);
  const iv = base64ToArrayBuffer(initialVector);
  const decryptedMessage = await crypto.subtle.decrypt(
    {
      name: AES_ALG,
      iv,
    },
    cryptoKey,
    arrayBuffer,
  );
  return textDecoder.decode(decryptedMessage);
}

/**
 * Encrypt RSA
 * @param publicKey receiver's public key in jwk
 * @param message data
 */
export async function encryptRsa(publicKey: JsonWebKey, message: string) {
  const textEncoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    publicKey,
    {
      name: RSA_ALG,
      hash: { name: 'SHA-256' },
    },
    true,
    ['encrypt'],
  );
  const encryptedMessage = await crypto.subtle.encrypt(
    {
      name: RSA_ALG,
    },
    cryptoKey,
    textEncoder.encode(message),
  );
  return {
    base64Data: arrayBufferToBase64(encryptedMessage),
  };
}

/**
 * Decrypt RSA
 * @param privateKey private key in jwk
 * @param encryptedMessage data in base64
 */
export async function decryptRsa(privateKey: JsonWebKey, encryptedMessage: string) {
  const textDecoder = new TextDecoder();
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    privateKey,
    { name: RSA_ALG, hash: { name: 'SHA-256' } },
    true,
    ['decrypt'],
  );
  const arrayBuffer = base64ToArrayBuffer(encryptedMessage);
  const decryptedMessage = await crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    cryptoKey,
    arrayBuffer,
  );
  return textDecoder.decode(decryptedMessage);
}

/** Hybrid encryption (AES + RSA) */
export async function encryptAsync(receiverPublicKey: JsonWebKey, message: string) {
  const aesJwk = await generateAesKey();
  const { base64Data: encryptedMessage, initialVector } = await encryptAes(aesJwk, message);
  const json = JSON.stringify({
    aes: aesJwk,
    iv: initialVector,
  });
  const { base64Data: encryptedAesKey } = await encryptRsa(receiverPublicKey, json);
  return { encryptedMessage, encryptedAesKey };
}

/** Hybrid decryption (RSA + AES) */
export async function decryptAsync(privateRsaKey: JsonWebKey, encryptedMessage: string, encryptedKey: string) {
  const decryptedKeyData = await decryptRsa(privateRsaKey, encryptedKey);
  const { aes, iv } = JSON.parse(decryptedKeyData);
  const message = await decryptAes(aes, encryptedMessage, iv);
  return message;
}
