import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const encryptionKey = Buffer.from('your-encryption-key'.padEnd(32, '\0'), 'utf-8'); // Ensure key is 32 bytes
const ivLength = 16; // IV length for AES

export function encrypt(text) {
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return { encryptedText: encrypted, iv: iv.toString('hex') };
} 

export function decrypt(encryptedData) {
    if (!encryptedData || typeof encryptedData.encryptedText !== 'string' || typeof encryptedData.iv !== 'string') {
        return '';
    }

    const decipher = crypto.createDecipheriv(algorithm, encryptionKey, Buffer.from(encryptedData.iv, 'hex'));
    let decrypted = decipher.update(encryptedData.encryptedText, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}
