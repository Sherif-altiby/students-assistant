import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Role, User } from '@prisma/client';
import { userRepository } from './user.repository';
import {
  CreateUserInput,
  UpdateUserInput,
  InviteDoctorInput,
  AcceptInvitationInput,
} from './user.schema';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/AppError';
import { env } from '../../config/env'; // adjust import if your env loader lives elsewhere
import { sendDoctorInvitationEmail } from '../../utils/mailer';

const SALT_ROUNDS = 10;
const INVITATION_TOKEN_TTL_HOURS = 48;

export type SafeUser = Omit<User, 'password' | 'invitationToken' | 'invitationTokenExpiresAt'>;

interface ListUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
}

/** Strip sensitive fields before a user object ever leaves this layer. */
const toSafeUser = (user: User): SafeUser => {
  const {
    password: _password,
    invitationToken: _token,
    invitationTokenExpiresAt: _exp,
    ...safeUser
  } = user;
  return safeUser;
};

export const userService = {
  async createUser(input: CreateUserInput): Promise<SafeUser> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Student self-signup: role defaults to USER, status defaults to ACTIVE
    // (see the @default(...) values on the Prisma model), so we only need
    // to pass the fields that are actually collected at signup.
    const user = await userRepository.create({
      email: input.email,
      name: input.name,
      password: hashedPassword,
      gender: input.gender,
      level: input.level,
      track: input.track,
      parentPhone: input.parentPhone,
      phone: input.phone,
      country: input.country,
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

  async listUsers(params: ListUsersParams): Promise<{
    users: SafeUser[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (params.page - 1) * params.limit;
    const filters = { search: params.search, role: params.role };

    const [users, total] = await Promise.all([
      userRepository.findMany({ skip, take: params.limit, ...filters }),
      userRepository.count(filters),
    ]);

    return {
      users: users.map(toSafeUser),
      total,
      page: params.page,
      limit: params.limit,
    };
  },

  async listDoctors(params: { page: number; limit: number; search?: string }): Promise<{
    users: SafeUser[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (params.page - 1) * params.limit;

    const [users, total] = await Promise.all([
      userRepository.findDoctors({ skip, take: params.limit, search: params.search }),
      userRepository.countDoctors({ search: params.search }),
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

  /**
   * Admin-only: creates a DOCTOR user with no password yet, generates a
   * single-use invitation token, and emails the doctor a link to activate
   * their account. This is the fix for the Prisma type error: `gender`,
   * `level`, `track`, `parentPhone`, and `country` are optional on the
   * model now, so a doctor row can omit them entirely.
   */
  async inviteDoctor(
    input: InviteDoctorInput
  ): Promise<{ id: string; email: string; status: string }> {
    const [existingByEmail, existingByPhone] = await Promise.all([
      userRepository.findByEmail(input.email),
      userRepository.findByPhone(input.phone),
    ]);

    if (existingByEmail || existingByPhone) {
      throw new ConflictError('A user with this email or phone already exists');
    }

    // Token is generated locally and doesn't depend on a DB row existing,
    // so we can build the link and send the email *before* creating the
    // doctor. If sending fails, we bail out and no user is ever created —
    // no orphaned "invited but never notified" accounts.
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationTokenExpiresAt = new Date(
      Date.now() + INVITATION_TOKEN_TTL_HOURS * 60 * 60 * 1000
    );
    const invitationLink = `${env.frontendUrl}/accept-invitation?token=${invitationToken}`;

    try {
      await sendDoctorInvitationEmail({
        to: input.email,
        name: input.name,
        invitationLink,
      });
    } catch (error) {
      throw new BadRequestError(
        'Failed to send invitation email. Doctor was not created — please try again.'
      );
    }

    const doctor = await userRepository.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: 'DOCTOR',
      status: 'PENDING',
      password: null,
      invitationToken,
      invitationTokenExpiresAt,
    });

    return { id: doctor.id, email: doctor.email, status: doctor.status };
  },

  /**
   * Public: the invitation token itself is the credential (single-use,
   * time-limited). The doctor sets their password here and the account
   * becomes ACTIVE.
   */
  async acceptInvitation(input: AcceptInvitationInput): Promise<SafeUser> {
    const user = await userRepository.findByInvitationToken(input.token);

    if (
      !user ||
      user.status !== 'PENDING' ||
      !user.invitationTokenExpiresAt ||
      user.invitationTokenExpiresAt < new Date()
    ) {
      throw new BadRequestError('Invalid or expired invitation link');
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const activated = await userRepository.update(user.id, {
      password: hashedPassword,
      status: 'ACTIVE',
      invitationToken: null,
      invitationTokenExpiresAt: null,
    });

    return toSafeUser(activated);
  },
};
