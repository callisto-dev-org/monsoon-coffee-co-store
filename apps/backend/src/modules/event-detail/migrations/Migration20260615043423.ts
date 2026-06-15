import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260615043423 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "event_detail" add column if not exists "booking_closed" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "event_detail" drop column if exists "booking_closed";`);
  }

}
