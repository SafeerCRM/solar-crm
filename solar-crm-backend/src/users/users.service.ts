import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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

  async createRole(data: Partial<User>) {
    const existing = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password!, 10);

    const user = this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || UserRole.TELECALLER,
    });

    return this.userRepository.save(user);
  }

  async create(data: Partial<User>) {
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
      role: user.role,
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
        role: user.role,
      },
    };
  }

  async findAssignableStaff() {
    return this.userRepository.find({
      where: {
        role: In([
          UserRole.LEAD_MANAGER,
          UserRole.TELECALLER,
          UserRole.PROJECT_MANAGER,
        ]),
      },
      select: ['id', 'name', 'email', 'role'],
      order: { id: 'ASC' },
    });
  }

  async findTelecallers() {
    return this.userRepository.find({
      where: { role: UserRole.TELECALLER },
      select: ['id', 'name', 'email', 'role'],
      order: { id: 'ASC' },
    });
  }

  async findAllUsers() {
    return this.userRepository.find({
      select: ['id', 'name', 'email', 'role', 'createdAt'],
      order: { id: 'ASC' },
    });
  }

  async findById(id: number) {
    return this.userRepository.findOne({
      where: { id },
    });
  }
}