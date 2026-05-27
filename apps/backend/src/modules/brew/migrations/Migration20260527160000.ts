import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Switch brew_settings from linking to product types → product categories.
 *
 * Renames the column and resets stored ids (the previous values pointed at
 * product_type rows, which are no longer the correct entity for this link).
 */
export class Migration20260527160000 extends Migration {
  override async up(): Promise<void> {
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
            AND column_name = 'enabled_product_category_ids'
        ) THEN
          ALTER TABLE "brew_settings"
            RENAME COLUMN "enabled_product_type_ids" TO "enabled_product_category_ids";
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'brew_settings'
            AND column_name = 'enabled_product_category_ids'
        ) THEN
          ALTER TABLE "brew_settings"
            ADD COLUMN "enabled_product_category_ids" jsonb NULL;
        END IF;
      END $$;
    `)

    // Stale ids: previous values were product_type ids, not product_category
    // ids. Reset so an operator re-picks the right entities.
    this.addSql(
      `UPDATE "brew_settings" SET "enabled_product_category_ids" = '[]'::jsonb;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'brew_settings'
            AND column_name = 'enabled_product_category_ids'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'brew_settings'
            AND column_name = 'enabled_product_type_ids'
        ) THEN
          ALTER TABLE "brew_settings"
            RENAME COLUMN "enabled_product_category_ids" TO "enabled_product_type_ids";
        END IF;
      END $$;
    `)
  }
}
