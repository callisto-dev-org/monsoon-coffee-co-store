import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260614051818 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "event_detail" add column if not exists "start_time" text null, add column if not exists "end_time" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "event_detail" drop column if exists "start_time", drop column if exists "end_time";`);
  }

}
