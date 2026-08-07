import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildPostgresTypeOrmOptions } from './database-url';
import {
  AuditEventEntity,
  DeduplicationCandidateEntity,
  FamilyEntity,
  FamilyMembershipEntity,
  ImmichSyncStateEntity,
  MediaAssetEntity,
  MediaInstanceEntity,
  PersonEntity,
  PersonNameEntity,
  UserAccountEntity,
  FamilyInviteEntity,
  MemoryEntity,
  MemoryCommentEntity,
  MemoryReactionEntity,
  RelationshipEdgeEntity,
} from './entities';
import { InitialSchema1730000000000 } from './migrations/1730000000000-InitialSchema';
import { MediaDedupProvenance1730000001000 } from './migrations/1730000001000-MediaDedupProvenance';
import { ImmichSyncAndDedup1730000002000 } from './migrations/1730000002000-ImmichSyncAndDedup';
import { SocialMemoriesRelationships1730000003000 } from './migrations/1730000003000-SocialMemoriesRelationships';
import { EchoTapVoiceMemories1730000004000 } from './migrations/1730000004000-EchoTapVoiceMemories';
import { UserAccountRole1730000005000 } from './migrations/1730000005000-UserAccountRole';

loadEnv({ path: ['.env', '.env.local'] });

export const entities = [
  UserAccountEntity,
  FamilyEntity,
  FamilyMembershipEntity,
  PersonEntity,
  PersonNameEntity,
  MediaAssetEntity,
  MediaInstanceEntity,
  DeduplicationCandidateEntity,
  ImmichSyncStateEntity,
  AuditEventEntity,
  FamilyInviteEntity,
  MemoryEntity,
  MemoryCommentEntity,
  MemoryReactionEntity,
  RelationshipEdgeEntity,
];

export const migrations = [
  InitialSchema1730000000000,
  MediaDedupProvenance1730000001000,
  ImmichSyncAndDedup1730000002000,
  SocialMemoriesRelationships1730000003000,
  EchoTapVoiceMemories1730000004000,
  UserAccountRole1730000005000,
];

export const AppDataSource = new DataSource({
  ...buildPostgresTypeOrmOptions(),
  entities,
  migrations,
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});
