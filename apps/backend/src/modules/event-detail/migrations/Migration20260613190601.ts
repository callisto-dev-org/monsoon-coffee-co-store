import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260613190601 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "event_detail" add column if not exists "images" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "event_detail" drop column if exists "images";`);
  }

}
