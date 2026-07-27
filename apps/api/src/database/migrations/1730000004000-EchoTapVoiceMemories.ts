import { MigrationInterface, QueryRunner } from 'typeorm';

export class EchoTapVoiceMemories1730000004000 implements MigrationInterface {
  name = 'EchoTapVoiceMemories1730000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "memory"
      ADD COLUMN IF NOT EXISTS "memory_kind" text NOT NULL DEFAULT 'photo'
    `);

    await queryRunner.query(`
      ALTER TABLE "memory"
      ALTER COLUMN "photo_path" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "memory"
      ADD COLUMN IF NOT EXISTS "audio_path" text
    `);

    await queryRunner.query(`
      ALTER TABLE "memory"
      ADD COLUMN IF NOT EXISTS "duration_ms" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "memory"
      ADD CONSTRAINT "CHK_memory_media_kind_path"
      CHECK (
        ("memory_kind" = 'photo' AND "photo_path" IS NOT NULL AND "audio_path" IS NULL)
        OR
        ("memory_kind" = 'voice' AND "audio_path" IS NOT NULL)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "memory" DROP CONSTRAINT IF EXISTS "CHK_memory_media_kind_path"`);
    await queryRunner.query(`DELETE FROM "memory" WHERE "memory_kind" = 'voice'`);
    await queryRunner.query(`ALTER TABLE "memory" ALTER COLUMN "photo_path" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "memory" DROP COLUMN IF EXISTS "duration_ms"`);
    await queryRunner.query(`ALTER TABLE "memory" DROP COLUMN IF EXISTS "audio_path"`);
    await queryRunner.query(`ALTER TABLE "memory" DROP COLUMN IF EXISTS "memory_kind"`);
  }
}
