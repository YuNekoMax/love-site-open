import { createHash } from 'node:crypto';

const [salt, password] = process.argv.slice(2);
if (!salt || !password) {
  console.error('用法: node scripts/hash-password.mjs <AUTH_SALT> <密码>');
  process.exit(1);
}
console.log(createHash('sha256').update(salt + password).digest('hex'));
