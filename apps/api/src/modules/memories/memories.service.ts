import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Repository, In } from 'typeorm';
import {
  MemoryCommentEntity,
  MemoryEntity,
  MemoryKind,
  MemoryReactionEntity,
  UserAccountEntity,
} from '../../database/entities';
import { FamilyAccessService } from '../family-access/family-access.service';

export class CreateMemoryDto {
  @IsUUID()
  familyId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(280)
  caption!: string;

  @IsOptional()
  @IsDateString()
  memoryDate?: string;
}

export class CreateVoiceMemoryDto {
  @IsUUID()
  familyId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  caption?: string;

  @IsOptional()
  @IsDateString()
  memoryDate?: string;

  durationMs?: number;
}

export interface MemorySummary {
  id: string;
  familyId: string;
  authorUserId: string;
  authorName: string;
  memoryKind: MemoryKind;
  caption: string;
  memoryDate?: string;
  createdAt: string;
  photoUrl?: string;
  audioUrl?: string;
  durationMs?: number;
  reactionCount: number;
  userReacted: boolean;
  commentCount: number;
}

export interface MemoryCommentSummary {
  id: string;
  memoryId: string;
  authorUserId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

const ALLOWED_IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_AUDIO_EXT = new Set(['.webm', '.m4a', '.mp3', '.ogg', '.wav', '.aac']);

@Injectable()
export class MemoriesService {
  private readonly uploadsDir: string;

  constructor(
    @InjectRepository(MemoryEntity)
    private readonly memoryRepository: Repository<MemoryEntity>,
    @InjectRepository(MemoryCommentEntity)
    private readonly commentRepository: Repository<MemoryCommentEntity>,
    @InjectRepository(MemoryReactionEntity)
    private readonly reactionRepository: Repository<MemoryReactionEntity>,
    @InjectRepository(UserAccountEntity)
    private readonly userRepository: Repository<UserAccountEntity>,
    private readonly familyAccess: FamilyAccessService,
  ) {
    this.uploadsDir = process.env.BIZIMKILER_UPLOADS_DIR ?? join(process.cwd(), 'uploads');
    if (!existsSync(this.uploadsDir)) {
      mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async listMemories(
    familyId: string,
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<MemorySummary[]> {
    await this.familyAccess.assertMembership(familyId, userId);

    const memories = await this.memoryRepository.find({
      where: { familyId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return Promise.all(memories.map((m) => this.enrichMemory(m, userId)));
  }

  async getMemory(id: string, userId: string): Promise<MemorySummary> {
    const memory = await this.memoryRepository.findOne({ where: { id } });
    if (!memory) {
      throw new NotFoundException('Memory not found.');
    }
    await this.familyAccess.assertMembership(memory.familyId, userId);
    return this.enrichMemory(memory, userId);
  }

  async createMemory(
    dto: CreateMemoryDto,
    userId: string,
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
  ): Promise<MemorySummary> {
    await this.familyAccess.assertMembership(dto.familyId, userId);

    const ext = extname(originalFilename).toLowerCase();
    if (!ALLOWED_IMAGE_EXT.has(ext)) {
      throw new BadRequestException('Unsupported image type. Use JPG, PNG, or WebP.');
    }

    if (!mimeType.startsWith('image/')) {
      throw new BadRequestException('File must be an image.');
    }

    const photoPath = `${dto.familyId}/${randomUUID()}${ext}`;
    const absolutePath = join(this.uploadsDir, photoPath);
    mkdirSync(join(this.uploadsDir, dto.familyId), { recursive: true });
    writeFileSync(absolutePath, fileBuffer);

    const memory = await this.memoryRepository.save(
      this.memoryRepository.create({
        familyId: dto.familyId,
        authorUserId: userId,
        memoryKind: MemoryKind.PHOTO,
        photoPath,
        audioPath: null,
        durationMs: null,
        caption: dto.caption.trim(),
        memoryDate: dto.memoryDate ?? null,
      }),
    );

    return this.enrichMemory(memory, userId);
  }

  async createVoiceMemory(
    dto: CreateVoiceMemoryDto,
    userId: string,
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
  ): Promise<MemorySummary> {
    await this.familyAccess.assertMembership(dto.familyId, userId);

    const ext = extname(originalFilename).toLowerCase();
    if (!ALLOWED_AUDIO_EXT.has(ext)) {
      throw new BadRequestException('Unsupported audio type. Use WebM, M4A, MP3, OGG, WAV, or AAC.');
    }

    if (!mimeType.startsWith('audio/')) {
      throw new BadRequestException('File must be an audio recording.');
    }

    const caption = dto.caption?.trim() || 'Voice memory';
    if (caption.length > 280) {
      throw new BadRequestException('Caption must be 280 characters or fewer.');
    }

    const durationMs =
      dto.durationMs !== undefined && Number.isFinite(dto.durationMs) && dto.durationMs > 0
        ? Math.round(dto.durationMs)
        : null;

    const audioPath = `${dto.familyId}/${randomUUID()}${ext}`;
    const absolutePath = join(this.uploadsDir, audioPath);
    mkdirSync(join(this.uploadsDir, dto.familyId), { recursive: true });
    writeFileSync(absolutePath, fileBuffer);

    const memory = await this.memoryRepository.save(
      this.memoryRepository.create({
        familyId: dto.familyId,
        authorUserId: userId,
        memoryKind: MemoryKind.VOICE,
        photoPath: null,
        audioPath,
        durationMs,
        caption,
        memoryDate: dto.memoryDate ?? null,
      }),
    );

    return this.enrichMemory(memory, userId);
  }

  async getPhotoStream(memoryId: string, userId: string) {
    const memory = await this.memoryRepository.findOne({ where: { id: memoryId } });
    if (!memory) {
      throw new NotFoundException('Memory not found.');
    }
    await this.familyAccess.assertMembership(memory.familyId, userId);

    if (memory.memoryKind !== MemoryKind.PHOTO || !memory.photoPath) {
      throw new NotFoundException('Photo file not found.');
    }

    const absolutePath = join(this.uploadsDir, memory.photoPath);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException('Photo file not found.');
    }

    return { stream: createReadStream(absolutePath), memory };
  }

  async getAudioStream(memoryId: string, userId: string) {
    const memory = await this.memoryRepository.findOne({ where: { id: memoryId } });
    if (!memory) {
      throw new NotFoundException('Memory not found.');
    }
    await this.familyAccess.assertMembership(memory.familyId, userId);

    if (memory.memoryKind !== MemoryKind.VOICE || !memory.audioPath) {
      throw new NotFoundException('Audio file not found.');
    }

    const absolutePath = join(this.uploadsDir, memory.audioPath);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException('Audio file not found.');
    }

    return {
      stream: createReadStream(absolutePath),
      memory,
      contentType: this.audioContentType(memory.audioPath),
    };
  }

  async listComments(memoryId: string, userId: string): Promise<MemoryCommentSummary[]> {
    const memory = await this.memoryRepository.findOne({ where: { id: memoryId } });
    if (!memory) throw new NotFoundException('Memory not found.');
    await this.familyAccess.assertMembership(memory.familyId, userId);

    const comments = await this.commentRepository.find({
      where: { memoryId },
      order: { createdAt: 'ASC' },
    });

    const authorIds = [...new Set(comments.map((c) => c.authorUserId))];
    const authors = authorIds.length
      ? await this.userRepository.find({ where: { id: In(authorIds) } })
      : [];
    const authorMap = new Map(authors.map((a) => [a.id, a.displayName]));

    return comments.map((c) => ({
      id: c.id,
      memoryId: c.memoryId,
      authorUserId: c.authorUserId,
      authorName: authorMap.get(c.authorUserId) ?? 'Member',
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async addComment(memoryId: string, body: string, userId: string): Promise<void> {
    const trimmed = body.trim();
    if (trimmed.length < 1 || trimmed.length > 500) {
      throw new BadRequestException('Comment must be 1–500 characters.');
    }

    const memory = await this.memoryRepository.findOne({ where: { id: memoryId } });
    if (!memory) throw new NotFoundException('Memory not found.');
    await this.familyAccess.assertMembership(memory.familyId, userId);

    await this.commentRepository.save(
      this.commentRepository.create({
        memoryId,
        authorUserId: userId,
        body: trimmed,
      }),
    );
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found.');

    const memory = await this.memoryRepository.findOne({ where: { id: comment.memoryId } });
    if (!memory) throw new NotFoundException('Comment not found.');

    const membership = await this.familyAccess.assertMembership(memory.familyId, userId);
    if (comment.authorUserId !== userId && membership.role !== 'owner') {
      throw new BadRequestException('Unauthorized.');
    }

    await this.commentRepository.delete(commentId);
  }

  async toggleReaction(memoryId: string, userId: string): Promise<void> {
    const memory = await this.memoryRepository.findOne({ where: { id: memoryId } });
    if (!memory) throw new NotFoundException('Memory not found.');
    await this.familyAccess.assertMembership(memory.familyId, userId);

    const existing = await this.reactionRepository.findOne({
      where: { memoryId, userId },
    });

    if (existing) {
      await this.reactionRepository.delete(existing.id);
    } else {
      await this.reactionRepository.save(
        this.reactionRepository.create({ memoryId, userId }),
      );
    }
  }

  private async enrichMemory(memory: MemoryEntity, userId: string): Promise<MemorySummary> {
    const author = await this.userRepository.findOne({ where: { id: memory.authorUserId } });
    const reactionCount = await this.reactionRepository.count({ where: { memoryId: memory.id } });
    const commentCount = await this.commentRepository.count({ where: { memoryId: memory.id } });
    const userReacted = await this.reactionRepository.exists({
      where: { memoryId: memory.id, userId },
    });

    return {
      id: memory.id,
      familyId: memory.familyId,
      authorUserId: memory.authorUserId,
      authorName: author?.displayName ?? 'Member',
      memoryKind: memory.memoryKind,
      caption: memory.caption,
      memoryDate: memory.memoryDate ?? undefined,
      createdAt: memory.createdAt.toISOString(),
      photoUrl:
        memory.memoryKind === MemoryKind.PHOTO ? `/api/memories/${memory.id}/photo` : undefined,
      audioUrl:
        memory.memoryKind === MemoryKind.VOICE ? `/api/memories/${memory.id}/audio` : undefined,
      durationMs: memory.durationMs ?? undefined,
      reactionCount,
      userReacted,
      commentCount,
    };
  }

  private audioContentType(audioPath: string): string {
    const ext = extname(audioPath).toLowerCase();
    if (ext === '.mp3') return 'audio/mpeg';
    if (ext === '.m4a') return 'audio/mp4';
    if (ext === '.ogg') return 'audio/ogg';
    if (ext === '.wav') return 'audio/wav';
    if (ext === '.aac') return 'audio/aac';
    return 'audio/webm';
  }
}
