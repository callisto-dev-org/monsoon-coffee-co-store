import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260520133701 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "review" add column if not exists "variant_id" text null, add column if not exists "variant_title" text null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_variant_id" ON "review" ("variant_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_review_variant_id";`);
    this.addSql(`alter table if exists "review" drop column if exists "variant_id", drop column if exists "variant_title";`);
  }

}
