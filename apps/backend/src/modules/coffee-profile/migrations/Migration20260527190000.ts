import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// Creates the coffee_bean_settings singleton table used by the Coffee Beans
// admin extension to store extension-level configuration — currently the
// shared tasting-notes label library.
export class Migration20260527190000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "coffee_bean_settings" (
        "id" text not null,
        "tasting_notes" jsonb null,
        "roast_levels" jsonb null,
        "processes" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "coffee_bean_settings_pkey" primary key ("id")
      );
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "coffee_bean_settings" cascade;`)
  }
}
