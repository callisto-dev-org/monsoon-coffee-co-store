import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260520115205 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "brew_method" drop column if exists "position";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "brew_method" add column if not exists "position" integer not null default 0;`);
  }

}
