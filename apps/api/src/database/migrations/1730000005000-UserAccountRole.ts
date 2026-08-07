import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserAccountRole1730000005000 implements MigrationInterface {
  name = 'UserAccountRole1730000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_account"
      ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'member'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_account"
      DROP COLUMN IF EXISTS "role"
    `);
  }
}
