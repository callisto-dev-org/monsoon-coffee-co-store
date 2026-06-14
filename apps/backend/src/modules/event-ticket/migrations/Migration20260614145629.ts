import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260614145629 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "event_ticket" drop constraint if exists "event_ticket_code_unique";`);
    this.addSql(`create table if not exists "event_ticket" ("id" text not null, "code" text not null, "order_id" text not null, "order_display_id" text null, "line_item_id" text null, "product_id" text null, "event_title" text null, "email" text null, "status" text check ("status" in ('valid', 'checked_in', 'void')) not null default 'valid', "checked_in_at" timestamptz null, "checked_in_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "event_ticket_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_event_ticket_code_unique" ON "event_ticket" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_event_ticket_deleted_at" ON "event_ticket" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_event_ticket_product_id" ON "event_ticket" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_event_ticket_order_id" ON "event_ticket" ("order_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "event_ticket" cascade;`);
  }

}
