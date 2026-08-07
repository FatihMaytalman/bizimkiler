import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FamilyInviteEntity,
  FamilyMembershipEntity,
  UserAccountEntity,
} from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { FamilyAccessModule } from '../family-access/family-access.module';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FamilyInviteEntity,
      FamilyMembershipEntity,
      UserAccountEntity,
    ]),
    forwardRef(() => AuthModule),
    FamilyAccessModule,
  ],
  controllers: [InvitesController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
