import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260531165053 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "newsletter_campaign" ("id" text not null, "subject" text not null, "body_markdown" text not null, "recipients" integer not null default 0, "sent" integer not null default 0, "failed" integer not null default 0, "status" text check ("status" in ('sending', 'sent', 'partial', 'failed')) not null default 'sending', "error" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "newsletter_campaign_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_newsletter_campaign_deleted_at" ON "newsletter_campaign" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "newsletter_campaign" cascade;`);
  }

}
