import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from './user.entity';
import { UserRoleHistory } from './user-role-history.entity';

@Injectable()
export class UsersService {
  constructor(
  @InjectRepository(User)
  private readonly userRepository: Repository<User>,

  @InjectRepository(UserRoleHistory)
  private readonly userRoleHistoryRepository: Repository<UserRoleHistory>,

  private readonly dataSource: DataSource,
  private readonly jwtService: JwtService,
) {}

private normalizeMobileNumber(value: unknown): string {
  let mobile = String(value ?? '')
    .trim()
    .replace(/[\s()-]/g, '');

  if (mobile.startsWith('+91') && mobile.length === 13) {
    mobile = mobile.slice(3);
  } else if (mobile.startsWith('91') && mobile.length === 12) {
    mobile = mobile.slice(2);
  } else if (mobile.startsWith('0') && mobile.length === 11) {
    mobile = mobile.slice(1);
  }

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    throw new BadRequestException(
      'Please enter a valid 10-digit Indian mobile number',
    );
  }

  return mobile;
}

private normalizeAadhaarNumber(value: unknown): string | null {
  const aadhaar = String(value ?? '')
    .trim()
    .replace(/[\s-]/g, '');

  if (!aadhaar) {
    return null;
  }

  if (!/^\d{12}$/.test(aadhaar)) {
    throw new BadRequestException(
      'Aadhaar number must contain exactly 12 digits',
    );
  }

  return aadhaar;
}

private normalizeServingCity(value: unknown): string {
  const city = String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();

  if (!city) {
    throw new BadRequestException(
      'City / Serving Area is required',
    );
  }

  if (city.length > 150) {
    throw new BadRequestException(
      'City / Serving Area cannot exceed 150 characters',
    );
  }

  return city;
}

private async ensureUniqueMobileNumber(
  mobileNumber: string,
  excludeUserId?: number,
): Promise<void> {
  const existing = await this.userRepository.findOne({
    where: { mobileNumber },
    select: ['id'],
  });

  if (existing && existing.id !== excludeUserId) {
    throw new BadRequestException(
      'A user with this mobile number already exists',
    );
  }
}

  private normalizeRoles(inputRoles?: UserRole[] | string[]): UserRole[] {
    const allowedRoles = Object.values(UserRole);
    const roles = Array.isArray(inputRoles) ? inputRoles : [];

    const cleanedRoles = roles
      .map((role) => String(role).trim())
      .filter((role) => allowedRoles.includes(role as UserRole)) as UserRole[];

    return cleanedRoles.length > 0
      ? [...new Set(cleanedRoles)]
      : [UserRole.TELECALLER];
  }

  async createRole(
  data: Partial<User> & { roles?: UserRole[] },
  currentUser: any,
) {
  const currentUserRoles: string[] = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : [];

  const isOwner = currentUserRoles.includes(UserRole.OWNER);
  const isHRManager = currentUserRoles.includes(UserRole.HR_MANAGER);

  if (!isOwner && !isHRManager) {
    throw new ForbiddenException(
      'Only OWNER or HR_MANAGER can create users',
    );
  }

  const normalizedRoles = this.normalizeRoles(data.roles);

  if (!isOwner && normalizedRoles.includes(UserRole.OWNER)) {
    throw new ForbiddenException(
      'Only OWNER can create an OWNER account',
    );
  }

  const existing = await this.userRepository.findOne({
    where: { email: data.email },
  });

  if (existing) {
    throw new BadRequestException('User with this email already exists');
  }

  if (!data.password) {
    throw new BadRequestException('Password is required');
  }

 const mobileNumber = this.normalizeMobileNumber(
  data.mobileNumber,
);

const aadhaarNumber = this.normalizeAadhaarNumber(
  data.aadhaarNumber,
);

const servingCity = this.normalizeServingCity(
  data.servingCity,
);

await this.ensureUniqueMobileNumber(mobileNumber);

const hashedPassword = await bcrypt.hash(
  data.password,
  10,
);

const user = this.userRepository.create({
  name: data.name,
  email: data.email,
  password: hashedPassword,
  roles: normalizedRoles,
  mobileNumber,
  aadhaarNumber,
  servingCity,
});

try {
  const savedUser = await this.userRepository.save(user);

  return {
    id: savedUser.id,
    name: savedUser.name,
    email: savedUser.email,
    roles: savedUser.roles,
    mobileNumber: savedUser.mobileNumber,
    aadhaarNumber: savedUser.aadhaarNumber,
    servingCity: savedUser.servingCity,
    isHidden: savedUser.isHidden,
    createdAt: savedUser.createdAt,
  };
} catch (error) {
  const dbError = error as {
    code?: string;
    constraint?: string;
  };

  if (dbError.code === '23505') {
    if (
      dbError.constraint === 'UQ_user_mobileNumber'
    ) {
      throw new BadRequestException(
        'A user with this mobile number already exists',
      );
    }

    throw new BadRequestException(
      'A user with these unique details already exists',
    );
  }

  throw error;
}
}

  async create(
  data: Partial<User> & { roles?: UserRole[] },
  currentUser: any,
) {
  return this.createRole(data, currentUser);
}

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isHidden) {
  throw new UnauthorizedException('This user account is disabled');
}

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles || [],
      name: user.name,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      access_token,
      token: access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles || [],
      },
    };
  }

  async findAssignableStaff() {
    return this.userRepository.find({
      where: {
        isHidden: false,
        roles: Raw(
          (alias) =>
            `${alias} LIKE :telecaller
             OR ${alias} LIKE :telecallingAssistant
             OR ${alias} LIKE :leadManager
             OR ${alias} LIKE :projectManager
             OR ${alias} LIKE :meetingManager
             OR ${alias} LIKE :telecallingManager
             OR ${alias} LIKE :solarStore`,
          {
            telecaller: '%TELECALLER%',
            telecallingAssistant: '%TELECALLING_ASSISTANT%',
            leadManager: '%LEAD_MANAGER%',
            projectManager: '%PROJECT_MANAGER%',
            meetingManager: '%MEETING_MANAGER%',
            telecallingManager: '%TELECALLING_MANAGER%',
            solarStore: '%SOLAR_STORE%',
          },
        ),
      },
      select: ['id', 'name', 'email', 'roles'],
      order: { id: 'ASC' },
    });
  }

  async findTelecallingAssistants() {
    return this.userRepository.find({
      where: {
        isHidden: false,
        roles: Raw((alias) => `${alias} LIKE :role`, {
          role: '%TELECALLING_ASSISTANT%',
        }),
      },
      select: ['id', 'name', 'email', 'roles'],
      order: { id: 'ASC' },
    });
  }

    async findMeetingManagers() {
    return this.userRepository.find({
      where: {
        isHidden: false,
        roles: Raw(
          (alias) =>
            `${alias} LIKE :meetingManager OR ${alias} LIKE :solarStore`,
          {
            meetingManager: '%MEETING_MANAGER%',
            solarStore: '%SOLAR_STORE%',
          },
        ),
      },
      select: ['id', 'name', 'email', 'roles'],
      order: { id: 'ASC' },
    });
  }

    async findLeadManagers() {
    return this.userRepository.find({
      where: {
        isHidden: false,
        roles: Raw(
          (alias) =>
            `${alias} LIKE :leadManager OR ${alias} LIKE :solarStore`,
          {
            leadManager: '%LEAD_MANAGER%',
            solarStore: '%SOLAR_STORE%',
          },
        ),
      },
      select: ['id', 'name', 'email', 'roles'],
      order: { id: 'ASC' },
    });
  }

  async findFranchiseManagers() {
  return this.userRepository.find({
    where: {
      isHidden: false,
      roles: Raw((alias) => `${alias} LIKE :role`, {
        role: '%FRANCHISE_MANAGER%',
      }),
    },
    select: ['id', 'name', 'email', 'roles'],
    order: { id: 'ASC' },
  });
}

  async findTelecallers() {
    return this.userRepository.find({
      where: {
        isHidden: false,
        roles: Raw(
          (alias) =>
            `${alias} LIKE :telecaller OR ${alias} LIKE :telecallingAssistant`,
          {
            telecaller: '%TELECALLER%',
            telecallingAssistant: '%TELECALLING_ASSISTANT%',
          },
        ),
      },
      select: ['id', 'name', 'email', 'roles'],
      order: { id: 'ASC' },
    });
  }

  async findCustomers() {
  return this.userRepository.find({
    where: {
      isHidden: false,
      roles: Raw((alias) => `${alias} LIKE :role`, {
        role: '%CUSTOMER%',
      }),
    },
    select: ['id', 'name', 'email', 'roles'],
    order: { id: 'ASC' },
  });
}

async findManagementUsers(includeHidden = false) {
  return this.userRepository.find({
    where: includeHidden
      ? {}
      : { isHidden: false },

    select: [
      'id',
      'name',
      'email',
      'mobileNumber',
      'aadhaarNumber',
      'servingCity',
      'roles',
      'createdAt',
      'isHidden',
      'hiddenAt',
      'hiddenBy',
      'hiddenByName',
      'hiddenReason',
      'restoredAt',
      'restoredBy',
      'restoredByName',
      'restoreReason',
    ],

    order: { id: 'ASC' },
  });
}

  async findAllUsers(includeHidden = false) {
  return this.userRepository.find({
    where: includeHidden ? {} : { isHidden: false },
    select: [
      'id',
      'name',
      'email',
      'roles',
      'createdAt',
      'isHidden',
      'hiddenAt',
      'hiddenBy',
      'hiddenByName',
      'hiddenReason',
      'restoredAt',
      'restoredBy',
      'restoredByName',
      'restoreReason',
    ],
    order: { id: 'ASC' },
  });
}

async updateUserDetails(
  id: number,
  data: {
    mobileNumber?: string;
    aadhaarNumber?: string | null;
    servingCity?: string;
  },
  currentUser: any,
) {
  const currentUserRoles: string[] = Array.isArray(
    currentUser?.roles,
  )
    ? currentUser.roles
    : [];

  const isOwner = currentUserRoles.includes(UserRole.OWNER);
  const isHRManager = currentUserRoles.includes(
    UserRole.HR_MANAGER,
  );

  if (!isOwner && !isHRManager) {
    throw new ForbiddenException(
      'Only OWNER or HR_MANAGER can update user details',
    );
  }

  const user = await this.userRepository.findOne({
    where: { id },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (!isOwner && user.roles?.includes(UserRole.OWNER)) {
    throw new ForbiddenException(
      'HR Manager cannot modify OWNER accounts',
    );
  }

  const updates: Partial<User> = {};

  if (data.mobileNumber !== undefined) {
    const mobileNumber = this.normalizeMobileNumber(
      data.mobileNumber,
    );

    await this.ensureUniqueMobileNumber(
      mobileNumber,
      id,
    );

    updates.mobileNumber = mobileNumber;
  }

  if (data.aadhaarNumber !== undefined) {
    updates.aadhaarNumber = this.normalizeAadhaarNumber(
      data.aadhaarNumber,
    );
  }

  if (data.servingCity !== undefined) {
    updates.servingCity = this.normalizeServingCity(
      data.servingCity,
    );
  }

  if (Object.keys(updates).length === 0) {
    throw new BadRequestException(
      'No user details provided for update',
    );
  }

  try {
    await this.userRepository.update(id, updates);
  } catch (error) {
    const dbError = error as {
      code?: string;
      constraint?: string;
    };

    if (dbError.code === '23505') {
      throw new BadRequestException(
        'A user with this mobile number already exists',
      );
    }

    throw error;
  }

  return {
    message: 'User details updated successfully',
  };
}

  async updateUserPassword(
  id: number,
  password: string,
  currentUser: any,
) {
  const currentUserRoles: string[] = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : [];

  const isOwner = currentUserRoles.includes(UserRole.OWNER);
  const isHRManager = currentUserRoles.includes(UserRole.HR_MANAGER);

  if (!isOwner && !isHRManager) {
    throw new ForbiddenException(
      'Only OWNER or HR_MANAGER can reset user passwords',
    );
  }

  const user = await this.userRepository.findOne({
    where: { id },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (
    !isOwner &&
    user.roles?.includes(UserRole.OWNER)
  ) {
    throw new ForbiddenException(
      'HR Manager cannot reset OWNER account passwords',
    );
  }

  if (!password || String(password).trim().length < 4) {
    throw new BadRequestException(
      'Password is required and must be at least 4 characters',
    );
  }

  user.password = await bcrypt.hash(String(password).trim(), 10);
  await this.userRepository.save(user);

  return {
    message: 'Password updated successfully',
  };
}

  async updateUserRoles(
    id: number,
    roles: UserRole[] | string[],
    currentUser: any,
  ) {
    const currentUserRoles: string[] = Array.isArray(currentUser?.roles)
      ? currentUser.roles
      : [];

    const isOwner = currentUserRoles.includes(UserRole.OWNER);
const isHRManager = currentUserRoles.includes(UserRole.HR_MANAGER);

if (!isOwner && !isHRManager) {
  throw new ForbiddenException(
    'Only OWNER or HR_MANAGER can update user roles',
  );
}

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const normalizedRoles = this.normalizeRoles(roles);

    if (!isOwner) {
  if (user.roles?.includes(UserRole.OWNER)) {
    throw new ForbiddenException(
      'HR Manager cannot modify OWNER accounts',
    );
  }

  if (normalizedRoles.includes(UserRole.OWNER)) {
    throw new ForbiddenException(
      'Only OWNER can assign the OWNER role',
    );
  }
}

    if (!normalizedRoles.length) {
      throw new BadRequestException('At least one valid role is required');
    }

    const targetIsOwner = Array.isArray(user.roles)
      ? user.roles.includes(UserRole.OWNER)
      : false;

    if (targetIsOwner && !normalizedRoles.includes(UserRole.OWNER)) {
      throw new BadRequestException('OWNER role cannot be removed from owner user');
    }

    const previousRoles = [...(user.roles || [])];

const rolesChanged =
  previousRoles.length !== normalizedRoles.length ||
  previousRoles.some(
    (role) => !normalizedRoles.includes(role),
  );

if (rolesChanged) {
  await this.dataSource.transaction(async (manager) => {
    user.roles = normalizedRoles;

    await manager.save(User, user);

    const history = this.userRoleHistoryRepository.create({
  userId: user.id,
  previousRoles: previousRoles.join(','),
  newRoles: normalizedRoles.join(','),
  changedBy:
    Number(currentUser?.id ?? currentUser?.userId) || undefined,
  changedByName:
    String(currentUser?.name ?? '') || undefined,
});

    await manager.save(UserRoleHistory, history);
  });
}

    return {
      message: 'User roles updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles || [],
      },
    };
  }

  async deleteUser(id: number, currentUser: any, reason?: string) {
  const currentUserRoles: string[] = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : [];

  if (
  !currentUserRoles.includes(UserRole.OWNER) &&
  !currentUserRoles.includes(UserRole.HR_MANAGER)
) {
  throw new ForbiddenException(
    'Only OWNER or HR_MANAGER can hide users',
  );
}

  const user = await this.userRepository.findOne({
    where: { id },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (user.roles?.includes(UserRole.OWNER)) {
    throw new BadRequestException('Owner user cannot be hidden');
  }

  if (user.isHidden) {
    throw new BadRequestException('User is already hidden');
  }

  user.isHidden = true;
  user.hiddenAt = new Date();
  user.hiddenBy = currentUser?.id || null;
  user.hiddenByName = currentUser?.name || null;
  user.hiddenReason = reason?.trim() || 'Hidden by owner';

  await this.userRepository.save(user);

  return {
    message: 'User hidden successfully',
  };
}

async restoreUser(id: number, currentUser: any, reason?: string) {
  const currentUserRoles: string[] = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : [];

  if (
  !currentUserRoles.includes(UserRole.OWNER) &&
  !currentUserRoles.includes(UserRole.HR_MANAGER)
) {
  throw new ForbiddenException(
    'Only OWNER or HR_MANAGER can restore users',
  );
}

  const user = await this.userRepository.findOne({
    where: { id },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (
  !currentUserRoles.includes(UserRole.OWNER) &&
  user.roles?.includes(UserRole.OWNER)
) {
  throw new ForbiddenException(
    'HR Manager cannot restore OWNER accounts',
  );
}

  if (!user.isHidden) {
    throw new BadRequestException('User is not hidden');
  }

  user.isHidden = false;
  user.restoredAt = new Date();
  user.restoredBy = currentUser?.id || null;
  user.restoredByName = currentUser?.name || null;
  user.restoreReason = reason?.trim() || 'Restored by owner';

  await this.userRepository.save(user);

  return {
    message: 'User restored successfully',
  };
}

  async findById(id: number) {
    return this.userRepository.findOne({
      where: { id },
    });
  }
}