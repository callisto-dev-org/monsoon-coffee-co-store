import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260520114202 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "brew_method" add column if not exists "steps" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "brew_method" drop column if exists "steps";`);
  }

}
