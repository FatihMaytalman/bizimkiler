import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildPostgresTypeOrmOptions } from './database/database-url';
import { entities, migrations } from './database/data-source';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { FamiliesModule } from './modules/families/families.module';
import { HealthModule } from './modules/health/health.module';
import { MediaModule } from './modules/media/media.module';
import { PeopleModule } from './modules/people/people.module';
import { InvitesModule } from './modules/invites/invites.module';
import { MemoriesModule } from './modules/memories/memories.module';
import { RelationshipsModule } from './modules/relationships/relationships.module';
import { SocialModule } from './modules/social/social.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...buildPostgresTypeOrmOptions(),
        entities,
        migrations,
        migrationsRun: true,
        synchronize: false,
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),
    HealthModule,
    AiModule,
    AuthModule,
    FamiliesModule,
    PeopleModule,
    MediaModule,
    MemoriesModule,
    InvitesModule,
    RelationshipsModule,
    SocialModule,
    AuditModule,
  ],
})
export class AppModule {}
