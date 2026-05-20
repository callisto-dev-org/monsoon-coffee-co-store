import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260520111529 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "brew_method" drop constraint if exists "brew_method_slug_unique";`);
    this.addSql(`create table if not exists "brew_method" ("id" text not null, "slug" text not null, "name" text not null, "method_label" text null, "summary" text null, "image_url" text null, "param_schema" jsonb null, "position" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "brew_method_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_brew_method_slug_unique" ON "brew_method" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_brew_method_deleted_at" ON "brew_method" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "brew_recipe" ("id" text not null, "product_id" text not null, "title" text null, "summary" text null, "params" jsonb null, "steps" jsonb null, "brew_method_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "brew_recipe_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_brew_recipe_product_id" ON "brew_recipe" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_brew_recipe_brew_method_id" ON "brew_recipe" ("brew_method_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_brew_recipe_deleted_at" ON "brew_recipe" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "brew_recipe" add constraint "brew_recipe_brew_method_id_foreign" foreign key ("brew_method_id") references "brew_method" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "brew_recipe" drop constraint if exists "brew_recipe_brew_method_id_foreign";`);

    this.addSql(`drop table if exists "brew_method" cascade;`);

    this.addSql(`drop table if exists "brew_recipe" cascade;`);
  }

}
