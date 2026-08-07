import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { FamilyEntity } from './family.entity';
import { UserAccountEntity } from './user-account.entity';

export const MEMBER_RELATIONSHIPS = [
  'self',
  'mother',
  'father',
  'sister',
  'brother',
  'spouse',
  'son',
  'daughter',
  'grandmother',
  'grandfather',
  'aunt',
  'uncle',
  'cousin',
  'in_law',
  'other',
] as const;

export type MemberRelationship = (typeof MEMBER_RELATIONSHIPS)[number];

export const INVITE_RELATIONSHIPS = MEMBER_RELATIONSHIPS.filter((r) => r !== 'self');

export enum MemoryKind {
  PHOTO = 'photo',
  VOICE = 'voice',
}

@Entity({ name: 'family_invite' })
@Unique(['familyId', 'email'])
@Unique(['inviteToken'])
export class FamilyInviteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'family_id', type: 'uuid' })
  familyId!: string;

  @ManyToOne(() => FamilyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'family_id' })
  family!: FamilyEntity;

  @Column({ type: 'text' })
  email!: string;

  @Column({ name: 'invited_by_user_id', type: 'uuid' })
  invitedByUserId!: string;

  @ManyToOne(() => UserAccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invited_by_user_id' })
  invitedBy!: UserAccountEntity;

  @Column({ type: 'text' })
  relationship!: string;

  @Column({ name: 'invite_token', type: 'uuid' })
  inviteToken!: string;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

@Entity({ name: 'memory' })
export class MemoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'family_id', type: 'uuid' })
  familyId!: string;

  @ManyToOne(() => FamilyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'family_id' })
  family!: FamilyEntity;

  @Column({ name: 'author_user_id', type: 'uuid' })
  authorUserId!: string;

  @ManyToOne(() => UserAccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_user_id' })
  author!: UserAccountEntity;

  @Column({ name: 'memory_kind', type: 'text', default: MemoryKind.PHOTO })
  memoryKind!: MemoryKind;

  @Column({ name: 'photo_path', type: 'text', nullable: true })
  photoPath!: string | null;

  @Column({ name: 'audio_path', type: 'text', nullable: true })
  audioPath!: string | null;

  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs!: number | null;

  @Column({ type: 'text' })
  caption!: string;

  @Column({ name: 'memory_date', type: 'date', nullable: true })
  memoryDate!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

@Entity({ name: 'memory_comment' })
export class MemoryCommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'memory_id', type: 'uuid' })
  memoryId!: string;

  @ManyToOne(() => MemoryEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memory_id' })
  memory!: MemoryEntity;

  @Column({ name: 'author_user_id', type: 'uuid' })
  authorUserId!: string;

  @ManyToOne(() => UserAccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_user_id' })
  author!: UserAccountEntity;

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

@Entity({ name: 'memory_reaction' })
@Unique(['memoryId', 'userId'])
export class MemoryReactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'memory_id', type: 'uuid' })
  memoryId!: string;

  @ManyToOne(() => MemoryEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memory_id' })
  memory!: MemoryEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserAccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserAccountEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

export enum RelationshipEdgeType {
  PARENT = 'parent',
  SPOUSE = 'spouse',
  PARTNER = 'partner',
}

@Entity({ name: 'relationship_edge' })
export class RelationshipEdgeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'family_id', type: 'uuid' })
  familyId!: string;

  @ManyToOne(() => FamilyEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'family_id' })
  family!: FamilyEntity;

  @Column({ type: 'text' })
  type!: RelationshipEdgeType;

  /** Parent/spouse/partner source person id */
  @Column({ name: 'from_person_id', type: 'uuid' })
  fromPersonId!: string;

  /** Child or partner target person id */
  @Column({ name: 'to_person_id', type: 'uuid' })
  toPersonId!: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
