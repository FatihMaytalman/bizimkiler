import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { FastifyRequest } from 'fastify';
import type { AuthenticatedUser } from './auth.service';
import { UserAccountRole } from '../../database/entities';

interface JwtPayload {
  sub: string;
  email: string;
  displayName: string;
  role?: UserAccountRole;
}

export type RequestWithUser = FastifyRequest & { user?: AuthenticatedUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const token = header.slice('Bearer '.length).trim();

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = {
        userId: payload.sub,
        email: payload.email,
        displayName: payload.displayName,
        role: payload.role ?? UserAccountRole.MEMBER,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
