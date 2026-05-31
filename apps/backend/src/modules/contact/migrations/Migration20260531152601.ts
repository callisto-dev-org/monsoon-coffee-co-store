import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260531152601 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "newsletter_subscriber" drop constraint if exists "newsletter_subscriber_email_unique";`);
    this.addSql(`create table if not exists "contact_message" ("id" text not null, "name" text not null, "email" text not null, "subject" text null, "message" text not null, "status" text check ("status" in ('new', 'read', 'archived')) not null default 'new', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "contact_message_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_contact_message_email" ON "contact_message" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_contact_message_deleted_at" ON "contact_message" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "newsletter_subscriber" ("id" text not null, "email" text not null, "status" text check ("status" in ('subscribed', 'unsubscribed')) not null default 'subscribed', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "newsletter_subscriber_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_newsletter_subscriber_email_unique" ON "newsletter_subscriber" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_newsletter_subscriber_deleted_at" ON "newsletter_subscriber" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "contact_message" cascade;`);

    this.addSql(`drop table if exists "newsletter_subscriber" cascade;`);
  }

}
