import { Migration } from "@medusajs/framework/mikro-orm/migrations"

// Collapses tasting_notes / roast_levels / processes into a single dynamic
// label_categories column so operators can add and remove their own
// categories from the Coffee Profile tab.
export class Migration20260527200000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'coffee_bean_settings'
            AND column_name = 'label_categories'
        ) THEN
          ALTER TABLE "coffee_bean_settings"
            ADD COLUMN "label_categories" jsonb NULL;
        END IF;
      END $$;
    `)

    // Preserve existing data: fold the three legacy columns into the new
    // dynamic structure. Only runs when the legacy columns still exist.
    this.addSql(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'coffee_bean_settings'
            AND column_name = 'roast_levels'
        ) THEN
          UPDATE "coffee_bean_settings"
          SET "label_categories" = (
            SELECT jsonb_agg(entry)
            FROM (
              SELECT jsonb_build_object(
                'id', 'roast-levels',
                'name', 'Roast levels',
                'values', COALESCE("roast_levels", '[]'::jsonb)
              ) AS entry
              UNION ALL
              SELECT jsonb_build_object(
                'id', 'processes',
                'name', 'Processes',
                'values', COALESCE("processes", '[]'::jsonb)
              )
              UNION ALL
              SELECT jsonb_build_object(
                'id', 'tasting-notes',
                'name', 'Tasting notes',
                'values', COALESCE("tasting_notes", '[]'::jsonb)
              )
            ) entries
          )
          WHERE "label_categories" IS NULL;
        END IF;
      END $$;
    `)

    this.addSql(`
      ALTER TABLE "coffee_bean_settings"
        DROP COLUMN IF EXISTS "roast_levels",
        DROP COLUMN IF EXISTS "processes",
        DROP COLUMN IF EXISTS "tasting_notes";
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "coffee_bean_settings"
        ADD COLUMN IF NOT EXISTS "tasting_notes" jsonb NULL,
        ADD COLUMN IF NOT EXISTS "roast_levels" jsonb NULL,
        ADD COLUMN IF NOT EXISTS "processes" jsonb NULL,
        DROP COLUMN IF EXISTS "label_categories";
    `)
  }
}
