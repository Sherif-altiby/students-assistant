import bcrypt from 'bcryptjs';
import { userRepository } from '../user/user.repository';
import { CreateUserInput } from '../user/user.schema';
import { LoginInput } from './auth.schema';
import { ConflictError, UnauthorizedError } from '../../utils/AppError';
import { SafeUser } from '../user/user.service';
import { jwtService } from '../../utils/Jwt';

const SALT_ROUNDS = 10;

interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

/** Strip the password hash before a user object ever leaves this layer. */
const toSafeUser = <T extends { password: string }>(user: T): Omit<T, 'password'> => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

const issueTokens = (user: { id: string; email: string }) => ({
  accessToken: jwtService.signAccessToken(user),
  refreshToken: jwtService.signRefreshToken(user),
});

export const authService = {
  async register(input: CreateUserInput): Promise<AuthResult> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
      gender: input.gender,
      level: input.level,
      track: input.track,
      parentPhone: input.parentPhone,
      phone: input.phone,
      country: input.country,
    });

    return { user: toSafeUser(user), ...issueTokens(user) };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);

    // Same error for "no such user" and "wrong password" — never reveal
    // which one it was, or an attacker can enumerate valid emails.
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(input.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return { user: toSafeUser(user), ...issueTokens(user) };
  },

  /** Issues a fresh access/refresh pair from a still-valid refresh token. */
  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = jwtService.verifyRefreshToken(refreshToken);

    const user = await userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    return issueTokens(user);
  },
};