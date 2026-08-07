import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccountEntity, UserAccountRole } from '../../database/entities';
import { hashPassword } from './password.util';

@Injectable()
export class SuperadminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SuperadminBootstrapService.name);

  constructor(
    @InjectRepository(UserAccountEntity)
    private readonly userRepository: Repository<UserAccountEntity>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.config.get<string>('AOM_SUPERADMIN_EMAIL')?.trim().toLowerCase();
    const password = this.config.get<string>('AOM_SUPERADMIN_PASSWORD')?.trim();
    const displayName = this.config.get<string>('AOM_SUPERADMIN_DISPLAY_NAME')?.trim();

    if (!email || !password) {
      return;
    }

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      if (existing.role !== UserAccountRole.SUPERADMIN) {
        existing.role = UserAccountRole.SUPERADMIN;
        await this.userRepository.save(existing);
        this.logger.log(`Promoted existing account to superadmin: ${email}`);
      }
      return;
    }

    const fallbackName = email.split('@')[0] ?? 'admin';
    await this.userRepository.save(
      this.userRepository.create({
        email,
        displayName: displayName ?? fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
        passwordHash: hashPassword(password),
        role: UserAccountRole.SUPERADMIN,
      }),
    );

    this.logger.log(`Superadmin account created for ${email}`);
  }
}
