import jwt from 'jsonwebtoken';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 bytes');
  }
  return secret;
}

export const generateToken = (payload: Record<string, any>) => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '30d' });
};

export const mock2FA = (email: string) => {
  // Mock 2FA - generates a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`2FA Code for ${email}: ${code}`);
  return code;
};

export const verify2FACode = (code: string, storedCode: string) => {
  return code === storedCode;
};
