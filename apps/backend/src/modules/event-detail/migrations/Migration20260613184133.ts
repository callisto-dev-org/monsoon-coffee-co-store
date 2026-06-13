import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260613184133 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "event_detail" drop constraint if exists "event_detail_product_id_unique";`);
    this.addSql(`create table if not exists "event_detail" ("id" text not null, "product_id" text not null, "partner" text null, "venue" text null, "city" text null, "date_label" text null, "event_date" timestamptz null, "seats_total" integer null, "description" text null, "highlights" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "event_detail_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_event_detail_product_id_unique" ON "event_detail" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_event_detail_deleted_at" ON "event_detail" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "event_detail" cascade;`);
  }

}
