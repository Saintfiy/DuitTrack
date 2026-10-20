import crypto from 'crypto';
import bcrypt from 'bcrypt';

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || Buffer.byteLength(key, 'utf8') !== 32) {
    throw new Error('ENCRYPTION_KEY must be configured as exactly 32 UTF-8 bytes');
  }
  return Buffer.from(key, 'utf8');
}

export const encryptData = (data: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    getEncryptionKey(),
    iv
  );
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

export const decryptData = (encryptedData: string): string => {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    getEncryptionKey(),
    iv
  );
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};
