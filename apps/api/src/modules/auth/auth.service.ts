import { ConflictException, Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccountEntity, UserAccountRole } from '../../database/entities';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { hashPassword, verifyPassword } from './password.util';
import { InvitesService } from '../invites/invites.service';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  displayName: string;
  role: UserAccountRole;
}

export interface AuthTokenResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccountEntity)
    private readonly userRepository: Repository<UserAccountEntity>,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => InvitesService))
    private readonly invitesService: InvitesService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokenResponse> {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.userRepository.exists({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const user = await this.userRepository.save(
      this.userRepository.create({
        email,
        displayName: dto.displayName.trim(),
        passwordHash: hashPassword(dto.password),
        role: UserAccountRole.MEMBER,
      }),
    );

    await this.invitesService.acceptPendingInvitesForUser(user.id);

    return this.buildToken(user);
  }

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    await this.invitesService.acceptPendingInvitesForUser(user.id);

    return this.buildToken(user);
  }

  async getProfile(userId: string): Promise<AuthenticatedUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Account no longer exists.');
    }
    return this.toAuthenticatedUser(user);
  }

  private async buildToken(
    user: UserAccountEntity,
  ): Promise<AuthTokenResponse> {
    const authUser = this.toAuthenticatedUser(user);
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    });

    return { accessToken, user: authUser };
  }

  private toAuthenticatedUser(user: UserAccountEntity): AuthenticatedUser {
    return {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role ?? UserAccountRole.MEMBER,
    };
  }
}
