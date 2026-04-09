import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  private normalizeRoles(inputRoles?: UserRole[] | string[]): UserRole[] {
    const allowedRoles = Object.values(UserRole);

    const roles = Array.isArray(inputRoles) ? inputRoles : [];

    const cleanedRoles = roles
      .map((role) => String(role).trim())
      .filter((role) => allowedRoles.includes(role as UserRole)) as UserRole[];

    return cleanedRoles.length > 0 ? [...new Set(cleanedRoles)] : [UserRole.TELECALLER];
  }

  async createRole(data: Partial<User> & { roles?: UserRole[] }) {
    const existing = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    if (!data.password) {
      throw new BadRequestException('Password is required');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      roles: this.normalizeRoles(data.roles),
    });

    return this.userRepository.save(user);
  }

  async create(data: Partial<User> & { roles?: UserRole[] }) {
    return this.createRole(data);
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
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
        roles: Raw(
          (alias) =>
            `${alias} LIKE :telecaller OR ${alias} LIKE :leadManager OR ${alias} LIKE :projectManager OR ${alias} LIKE :meetingManager OR ${alias} LIKE :telecallingManager`,
          {
            telecaller: '%TELECALLER%',
            leadManager: '%LEAD_MANAGER%',
            projectManager: '%PROJECT_MANAGER%',
            meetingManager: '%MEETING_MANAGER%',
            telecallingManager: '%TELECALLING_MANAGER%',
          },
        ),
      },
      select: ['id', 'name', 'email', 'roles'],
      order: { id: 'ASC' },
    });
  }

  async findTelecallers() {
    return this.userRepository.find({
      where: {
        roles: Raw((alias) => `${alias} LIKE :role`, {
          role: '%TELECALLER%',
        }),
      },
      select: ['id', 'name', 'email', 'roles'],
      order: { id: 'ASC' },
    });
  }

  async findAllUsers() {
    return this.userRepository.find({
      select: ['id', 'name', 'email', 'roles', 'createdAt'],
      order: { id: 'ASC' },
    });
  }

  async updateUserPassword(id: number, password: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
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

  async findById(id: number) {
    return this.userRepository.findOne({
      where: { id },
    });
  }
}