import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'mysecretkey',
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'name', 'email', 'roles', 'isHidden'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isHidden) {
      throw new UnauthorizedException('This user account is disabled');
    }

    return {
      id: user.id,
      userId: user.id,
      email: user.email,
      roles: user.roles || [],
      name: user.name,
    };
  }
}