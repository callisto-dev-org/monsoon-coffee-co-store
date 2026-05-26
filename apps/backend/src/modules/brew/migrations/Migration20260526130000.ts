import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260526130000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "brew_settings" (
        "id" text not null,
        "enabled_product_type_ids" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "brew_settings_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_brew_settings_deleted_at" ON "brew_settings" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "brew_settings" cascade;`)
  }
}
