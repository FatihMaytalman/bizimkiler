import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMemoryDto, CreateVoiceMemoryDto, MemoriesService } from './memories.service';

@Controller('memories')
export class MemoriesController {
  constructor(private readonly memoriesService: MemoriesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  listMemories(
    @Query('familyId') familyId: string,
    @Query('limit') limit: string | undefined,
    @Query('offset') offset: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!familyId) {
      throw new BadRequestException('familyId is required.');
    }
    return this.memoriesService.listMemories(
      familyId,
      user.userId,
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getMemory(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.memoriesService.getMemory(id, user.userId);
  }

  @Get(':id/photo')
  @UseGuards(JwtAuthGuard)
  async getPhoto(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() reply: FastifyReply,
  ) {
    const { stream } = await this.memoriesService.getPhotoStream(id, user.userId);
    reply.header('Cache-Control', 'private, max-age=3600');
    return reply.send(stream);
  }

  @Get(':id/audio')
  @UseGuards(JwtAuthGuard)
  async getAudio(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() reply: FastifyReply,
  ) {
    const { stream, contentType } = await this.memoriesService.getAudioStream(id, user.userId);
    reply.header('Cache-Control', 'private, max-age=3600');
    reply.header('Content-Type', contentType);
    return reply.send(stream);
  }

  @Post('voice')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  async createVoiceMemory(@Req() req: FastifyRequest, @CurrentUser() user: AuthenticatedUser) {
    const data = await req.file();
    if (!data) {
      throw new BadRequestException('Audio file is required.');
    }

    const fields = data.fields as Record<string, { value?: string } | undefined>;
    const familyId = fields.familyId?.value;
    const caption = fields.caption?.value;
    const memoryDate = fields.memoryDate?.value;
    const durationMs = fields.durationMs?.value;

    if (!familyId) {
      throw new BadRequestException('familyId is required.');
    }

    const buffer = await data.toBuffer();
    const dto: CreateVoiceMemoryDto = {
      familyId,
      caption: caption || undefined,
      memoryDate: memoryDate || undefined,
      durationMs: durationMs ? Number(durationMs) : undefined,
    };

    return this.memoriesService.createVoiceMemory(
      dto,
      user.userId,
      buffer,
      data.filename,
      data.mimetype,
    );
  }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  async createMemory(@Req() req: FastifyRequest, @CurrentUser() user: AuthenticatedUser) {
    const data = await req.file();
    if (!data) {
      throw new BadRequestException('Photo file is required.');
    }

    const fields = data.fields as Record<string, { value?: string } | undefined>;
    const familyId = fields.familyId?.value;
    const caption = fields.caption?.value;
    const memoryDate = fields.memoryDate?.value;

    if (!familyId || !caption) {
      throw new BadRequestException('familyId and caption are required.');
    }

    const buffer = await data.toBuffer();
    const dto: CreateMemoryDto = {
      familyId,
      caption,
      memoryDate: memoryDate || undefined,
    };

    return this.memoriesService.createMemory(
      dto,
      user.userId,
      buffer,
      data.filename,
      data.mimetype,
    );
  }

  @Get(':id/comments')
  @UseGuards(JwtAuthGuard)
  listComments(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.memoriesService.listComments(id, user.userId);
  }

  @Post(':id/comments')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  addComment(
    @Param('id') id: string,
    @Body('body') body: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.memoriesService.addComment(id, body, user.userId);
  }

  @Delete('comments/:commentId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.memoriesService.deleteComment(commentId, user.userId);
  }

  @Post(':id/reactions/toggle')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async toggleReaction(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.memoriesService.toggleReaction(id, user.userId);
  }
}
