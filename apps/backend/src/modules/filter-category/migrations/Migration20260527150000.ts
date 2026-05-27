import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260527150000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "filter_category" ("id" text not null, "name" text not null, "handle" text not null, "rank" integer not null default 0, "tag_ids" jsonb null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "filter_category_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_filter_category_handle_unique" ON "filter_category" ("handle") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_filter_category_deleted_at" ON "filter_category" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "filter_category" cascade;`)
  }
}
