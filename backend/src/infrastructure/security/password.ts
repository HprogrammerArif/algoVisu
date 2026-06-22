import bcrypt from 'bcryptjs';
import type { PasswordService } from '../../types/dependencies';

const SALT_ROUNDS = 10;

export const passwordService: PasswordService = {
  hash: (plain) => bcrypt.hash(plain, SALT_ROUNDS),
  compare: (plain, hash) => bcrypt.compare(plain, hash),
};
