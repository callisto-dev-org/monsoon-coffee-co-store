import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Rename `enabled_category_ids` → `enabled_product_type_ids` on `brew_settings`.
 * No-op for fresh installs where the column was already created with the new
 * name by Migration20260526130000.
 */
export class Migration20260526131000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'brew_settings'
            AND column_name = 'enabled_category_ids'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'brew_settings'
            AND column_name = 'enabled_product_type_ids'
        ) THEN
          ALTER TABLE "brew_settings"
            RENAME COLUMN "enabled_category_ids" TO "enabled_product_type_ids";
        END IF;
      END $$;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'brew_settings'
            AND column_name = 'enabled_product_type_ids'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'brew_settings'
            AND column_name = 'enabled_category_ids'
        ) THEN
          ALTER TABLE "brew_settings"
            RENAME COLUMN "enabled_product_type_ids" TO "enabled_category_ids";
        END IF;
      END $$;
    `)
  }
}
