import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { userRepository } from './user.repository';
import { CreateUserInput, UpdateUserInput } from './user.schema';
import { ConflictError, NotFoundError } from '../../utils/AppError';

const SALT_ROUNDS = 10;

export type SafeUser = Omit<User, 'password'>;

/** Strip the password hash before a user object ever leaves this layer. */
const toSafeUser = (user: User): SafeUser => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

export const userService = {
  async createUser(input: CreateUserInput): Promise<SafeUser> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await userRepository.create({
      email: input.email,
      name: input.name,
      password: hashedPassword,
    });

    return toSafeUser(user);
  },

  async getUserById(id: string): Promise<SafeUser> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toSafeUser(user);
  },

  async listUsers(params: { page: number; limit: number }): Promise<{
    users: SafeUser[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (params.page - 1) * params.limit;
    const [users, total] = await Promise.all([
      userRepository.findMany({ skip, take: params.limit }),
      userRepository.count(),
    ]);

    return {
      users: users.map(toSafeUser),
      total,
      page: params.page,
      limit: params.limit,
    };
  },

  async updateUser(id: string, input: UpdateUserInput): Promise<SafeUser> {
    await this.getUserById(id); // throws NotFoundError if missing

    if (input.email) {
      const existing = await userRepository.findByEmail(input.email);
      if (existing && existing.id !== id) {
        throw new ConflictError('A user with this email already exists');
      }
    }

    const user = await userRepository.update(id, input);
    return toSafeUser(user);
  },

  async deleteUser(id: string): Promise<void> {
    await this.getUserById(id); // throws NotFoundError if missing
    await userRepository.delete(id);
  },
};
