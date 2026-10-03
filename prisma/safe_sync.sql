-- Safe additive schema sync (no drops, no destructive type changes)

CREATE TABLE IF NOT EXISTS "hps_sheet_type" (
    "sheet_id" SERIAL NOT NULL,
    "sheet_type" VARCHAR(120) NOT NULL,
    "sheet_price" VARCHAR(12) NOT NULL DEFAULT '0',
    CONSTRAINT "hps_sheet_type_pkey" PRIMARY KEY ("sheet_id")
);

CREATE TABLE IF NOT EXISTS "hps_user_level" (
    "user_level_id" SERIAL NOT NULL,
    "user_level_name" VARCHAR(120) NOT NULL,
    CONSTRAINT "hps_user_level_pkey" PRIMARY KEY ("user_level_id")
);

-- Schema allows null particular on material items
ALTER TABLE "hps_material_item"
  ALTER COLUMN "material_item_particular" DROP NOT NULL;

-- Safe foreign keys only (orphan checks passed)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hps_bundle_info_sheeting_roll_id_fkey'
  ) THEN
    ALTER TABLE "hps_bundle_info"
      ADD CONSTRAINT "hps_bundle_info_sheeting_roll_id_fkey"
      FOREIGN KEY ("sheeting_roll_id") REFERENCES "hps_sheeting_roll"("sheeting_roll_id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hps_material_item_material_info_id_fkey'
  ) THEN
    ALTER TABLE "hps_material_item"
      ADD CONSTRAINT "hps_material_item_material_info_id_fkey"
      FOREIGN KEY ("material_info_id") REFERENCES "hps_material_info"("material_info_id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hps_material_item_material_item_particular_fkey'
  ) THEN
    ALTER TABLE "hps_material_item"
      ADD CONSTRAINT "hps_material_item_material_item_particular_fkey"
      FOREIGN KEY ("material_item_particular") REFERENCES "hps_particular"("particular_id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hps_stock_material_item_id_fkey'
  ) THEN
    ALTER TABLE "hps_stock"
      ADD CONSTRAINT "hps_stock_material_item_id_fkey"
      FOREIGN KEY ("material_item_id") REFERENCES "hps_material_item"("material_item_id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
