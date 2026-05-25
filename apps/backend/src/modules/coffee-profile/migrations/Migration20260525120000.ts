import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260525120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "coffee_profile" (
      "id" text not null,
      "product_id" text not null,
      "origin" text null,
      "altitude_m" integer null,
      "varietal" text null,
      "process" text null,
      "roast_level" text null,
      "roast_date" timestamptz null,
      "harvest_year" integer null,
      "recommended_ratio" text null,
      "tasting_notes" jsonb null,
      "extraction_profile" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "coffee_profile_pkey" primary key ("id")
    );`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_coffee_profile_product_id_unique" ON "coffee_profile" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_coffee_profile_deleted_at" ON "coffee_profile" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "coffee_profile" cascade;`);
  }
}
