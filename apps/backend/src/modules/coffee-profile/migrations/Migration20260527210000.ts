import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// Add a free-form jsonb column for admin-defined coffee-profile label
// categories beyond the built-in roast / process / tasting-note fields.
export class Migration20260527210000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "coffee_profile"
        ADD COLUMN IF NOT EXISTS "custom_labels" jsonb NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "coffee_profile"
        DROP COLUMN IF EXISTS "custom_labels";
    `)
  }
}
