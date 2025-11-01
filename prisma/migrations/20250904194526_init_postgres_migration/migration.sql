-- CreateTable
CREATE TABLE "hps_bag_type" (
    "bag_id" SERIAL NOT NULL,
    "bags_select" INTEGER NOT NULL,
    "bag_type" VARCHAR(120) NOT NULL,
    "bag_price" VARCHAR(5) NOT NULL DEFAULT '0',

    CONSTRAINT "hps_bag_type_pkey" PRIMARY KEY ("bag_id")
);

-- CreateTable
CREATE TABLE "hps_bill_info" (
    "bill_info_id" SERIAL NOT NULL,
    "customer_name" INTEGER NOT NULL,
    "bill_do" VARCHAR(11) NOT NULL,
    "bill_total" VARCHAR(12) NOT NULL,
    "add_date" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_bill_info_pkey" PRIMARY KEY ("bill_info_id")
);

-- CreateTable
CREATE TABLE "hps_bill_item" (
    "bill_item_id" SERIAL NOT NULL,
    "bill_info_id" INTEGER NOT NULL,
    "de_number" INTEGER NOT NULL,
    "bundel_type" INTEGER NOT NULL,
    "bundel_qty" VARCHAR(255) NOT NULL,
    "item_price" VARCHAR(12) NOT NULL,
    "item_total" VARCHAR(12) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_bill_item_pkey" PRIMARY KEY ("bill_item_id")
);

-- CreateTable
CREATE TABLE "hps_bundle_info" (
    "bundle_info_id" SERIAL NOT NULL,
    "bundle_barcode" INTEGER NOT NULL,
    "bundle_type" VARCHAR(120) NOT NULL,
    "bundle_info_weight" VARCHAR(120) NOT NULL,
    "bundle_info_bags" VARCHAR(120) NOT NULL,
    "bundle_info_average" VARCHAR(120) NOT NULL,
    "bundle_info_wastage_weight" VARCHAR(120) NOT NULL,
    "bundle_info_wastage_bags" VARCHAR(120) NOT NULL,
    "bundle_qty" INTEGER NOT NULL,
    "bundle_slitt_wastage" VARCHAR(120) NOT NULL,
    "bundle_print_wastage" VARCHAR(120) NOT NULL,
    "bundle_cutting_wastage" VARCHAR(120) NOT NULL,
    "bundle_date" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "bundle_info_status" INTEGER NOT NULL,

    CONSTRAINT "hps_bundle_info_pkey" PRIMARY KEY ("bundle_info_id")
);

-- CreateTable
CREATE TABLE "hps_colour" (
    "colour_id" SERIAL NOT NULL,
    "colour_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "hps_colour_pkey" PRIMARY KEY ("colour_id")
);

-- CreateTable
CREATE TABLE "hps_complete_item" (
    "complete_item_id" SERIAL NOT NULL,
    "complete_item_info" INTEGER NOT NULL,
    "bundle_type" VARCHAR(120) NOT NULL,
    "complete_item_weight" VARCHAR(120) NOT NULL,
    "complete_item_bags" VARCHAR(120) NOT NULL,
    "complete_item_barcode" VARCHAR(120) NOT NULL,
    "complete_item_date" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_complete_item_pkey" PRIMARY KEY ("complete_item_id")
);

-- CreateTable
CREATE TABLE "hps_customer" (
    "customer_id" SERIAL NOT NULL,
    "customer_full_name" VARCHAR(220) NOT NULL,
    "contact_person" VARCHAR(240) NOT NULL,
    "customer_address" VARCHAR(300) NOT NULL,
    "customer_tel" VARCHAR(15) NOT NULL,
    "customer_mobile" VARCHAR(15),
    "customer_email_address" VARCHAR(300),
    "customer_add_date" TIMESTAMP(3) NOT NULL,
    "hps_user_id" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_customer_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "hps_cutting" (
    "cutting_id" SERIAL NOT NULL,
    "job_card_id" INTEGER NOT NULL,
    "roll_barcode_no" VARCHAR(120) NOT NULL,
    "cutting_weight" VARCHAR(120) NOT NULL,
    "number_of_roll" INTEGER NOT NULL,
    "wastage" VARCHAR(12) NOT NULL,
    "added_date" TIMESTAMP(3) NOT NULL,
    "update_date" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_cutting_pkey" PRIMARY KEY ("cutting_id")
);

-- CreateTable
CREATE TABLE "hps_cutting_roll" (
    "cutting_roll_id" SERIAL NOT NULL,
    "job_card_id" INTEGER NOT NULL,
    "cutting_id" INTEGER NOT NULL,
    "cutting_roll_weight" VARCHAR(12) NOT NULL,
    "no_of_bags" INTEGER NOT NULL,
    "cutting_wastage" VARCHAR(120) NOT NULL,
    "cutting_barcode" VARCHAR(120),
    "add_date" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_cutting_roll_pkey" PRIMARY KEY ("cutting_roll_id")
);

-- CreateTable
CREATE TABLE "hps_cutting_type" (
    "cutting_id" SERIAL NOT NULL,
    "cutting_type" VARCHAR(120) NOT NULL,

    CONSTRAINT "hps_cutting_type_pkey" PRIMARY KEY ("cutting_id")
);

-- CreateTable
CREATE TABLE "hps_cutting_wastage" (
    "cutting_wastage_id" SERIAL NOT NULL,
    "job_card_id" INTEGER NOT NULL,
    "cutting_id" INTEGER NOT NULL,
    "cutting_wastage" VARCHAR(120) NOT NULL,
    "added_date" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_cutting_wastage_pkey" PRIMARY KEY ("cutting_wastage_id")
);

-- CreateTable
CREATE TABLE "hps_jobcard" (
    "job_card_id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "section_list" VARCHAR(30) NOT NULL,
    "unit_price" VARCHAR(120) NOT NULL,
    "slitting_roll_type" INTEGER NOT NULL,
    "slitting_paper_gsm" VARCHAR(120) NOT NULL,
    "slitting_paper_size" INTEGER NOT NULL,
    "slitting_size" VARCHAR(255),
    "slitting_remark" VARCHAR(250) NOT NULL,
    "printing_size" INTEGER NOT NULL,
    "printing_color_type" VARCHAR(120),
    "printing_color_name" VARCHAR(420),
    "printing_no_of_bag" VARCHAR(240),
    "printing_remark" VARCHAR(240) NOT NULL,
    "block_size" VARCHAR(120) NOT NULL,
    "cutting_type" INTEGER NOT NULL,
    "cutting_bags_select" VARCHAR(120),
    "cutting_bag_type" INTEGER NOT NULL,
    "cutting_print_name" VARCHAR(255),
    "cuting_no_of_bag" VARCHAR(240),
    "cuting_remark" VARCHAR(250) NOT NULL,
    "cutting_fold" VARCHAR(240) NOT NULL,
    "add_date" TIMESTAMP(3) NOT NULL,
    "updated_date" TIMESTAMP(3) NOT NULL,
    "delivery_date" VARCHAR(100) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "card_slitting" INTEGER NOT NULL,
    "card_printting" INTEGER NOT NULL,
    "card_cutting" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_jobcard_pkey" PRIMARY KEY ("job_card_id")
);

-- CreateTable
CREATE TABLE "hps_login" (
    "he_user_id" SERIAL NOT NULL,
    "he_full_name" VARCHAR(120) NOT NULL,
    "he_username" VARCHAR(120) NOT NULL,
    "he_password" VARCHAR(120) NOT NULL,
    "he_email" VARCHAR(120) NOT NULL,
    "user_level" VARCHAR(250) NOT NULL,
    "he_created_date" TIMESTAMP(3) NOT NULL,
    "he_del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_login_pkey" PRIMARY KEY ("he_user_id")
);

-- CreateTable
CREATE TABLE "hps_material_info" (
    "material_info_id" SERIAL NOT NULL,
    "material_supplier" INTEGER NOT NULL,
    "total_reels" INTEGER NOT NULL,
    "total_net_weight" DOUBLE PRECISION NOT NULL,
    "total_gross_weight" DOUBLE PRECISION NOT NULL,
    "add_date" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "material_info_status" INTEGER NOT NULL,

    CONSTRAINT "hps_material_info_pkey" PRIMARY KEY ("material_info_id")
);

-- CreateTable
CREATE TABLE "hps_material_item" (
    "material_item_id" SERIAL NOT NULL,
    "material_info_id" INTEGER NOT NULL,
    "material_item_reel_no" VARCHAR(255) NOT NULL,
    "material_colour" VARCHAR(255) NOT NULL,
    "material_item_particular" INTEGER NOT NULL,
    "material_item_Variety" VARCHAR(255) NOT NULL,
    "material_item_gsm" VARCHAR(255) NOT NULL,
    "material_item_size" VARCHAR(255) NOT NULL,
    "material_item_net_weight" VARCHAR(255) NOT NULL,
    "material_item_gross_weight" VARCHAR(255) NOT NULL,
    "material_item_barcode" VARCHAR(25) NOT NULL,
    "added_date" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "material_status" INTEGER NOT NULL,

    CONSTRAINT "hps_material_item_pkey" PRIMARY KEY ("material_item_id")
);

-- CreateTable
CREATE TABLE "hps_non_complete_item" (
    "non_complete_id" SERIAL NOT NULL,
    "non_complete_info" INTEGER NOT NULL,
    "non_complete_weight" VARCHAR(120) NOT NULL,
    "non_complete_bags" VARCHAR(120) NOT NULL,
    "non_complete_barcode" VARCHAR(120) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_non_complete_item_pkey" PRIMARY KEY ("non_complete_id")
);

-- CreateTable
CREATE TABLE "hps_particular" (
    "particular_id" SERIAL NOT NULL,
    "particular_name" VARCHAR(240) NOT NULL,
    "added_date" TIMESTAMP(3),
    "particular_status" INTEGER NOT NULL,

    CONSTRAINT "hps_particular_pkey" PRIMARY KEY ("particular_id")
);

-- CreateTable
CREATE TABLE "hps_print" (
    "print_id" SERIAL NOT NULL,
    "job_card_id" INTEGER NOT NULL,
    "print_barcode_no" VARCHAR(129) NOT NULL,
    "number_of_bag" INTEGER NOT NULL,
    "balance_weight" VARCHAR(10) NOT NULL,
    "balance_width" VARCHAR(10) NOT NULL,
    "print_wastage" VARCHAR(120) NOT NULL,
    "added_date" TIMESTAMP(3) NOT NULL,
    "update_date" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_print_pkey" PRIMARY KEY ("print_id")
);

-- CreateTable
CREATE TABLE "hps_print_pack" (
    "pack_id" SERIAL NOT NULL,
    "job_card_id" INTEGER NOT NULL,
    "print_id" INTEGER NOT NULL,
    "print_pack_weight" VARCHAR(11) NOT NULL,
    "print_barcode" VARCHAR(120) NOT NULL,
    "add_date" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_print_pack_pkey" PRIMARY KEY ("pack_id")
);

-- CreateTable
CREATE TABLE "hps_print_size" (
    "print_size_id" SERIAL NOT NULL,
    "print_size" VARCHAR(120) NOT NULL,

    CONSTRAINT "hps_print_size_pkey" PRIMARY KEY ("print_size_id")
);

-- CreateTable
CREATE TABLE "hps_print_wastage" (
    "print_wastage_id" SERIAL NOT NULL,
    "job_card_id" INTEGER NOT NULL,
    "print_id" INTEGER NOT NULL,
    "print_wastage" VARCHAR(120) NOT NULL,
    "add_date" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_print_wastage_pkey" PRIMARY KEY ("print_wastage_id")
);

-- CreateTable
CREATE TABLE "hps_return_info" (
    "return_info_id" SERIAL NOT NULL,
    "customer_name" INTEGER NOT NULL,
    "customer_address" VARCHAR(120) NOT NULL,
    "customer_contact" VARCHAR(120) NOT NULL,
    "return_no_bags" VARCHAR(11) NOT NULL,
    "add_date" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_return_info_pkey" PRIMARY KEY ("return_info_id")
);

-- CreateTable
CREATE TABLE "hps_return_item" (
    "return_item_id" SERIAL NOT NULL,
    "return_info_id" INTEGER NOT NULL,
    "complete_item_id" INTEGER NOT NULL,
    "barcode_no" VARCHAR(255) NOT NULL,
    "bundle_type" VARCHAR(255) NOT NULL,
    "n_weight" DOUBLE PRECISION NOT NULL,
    "no_of_bags" INTEGER NOT NULL,
    "item_price" VARCHAR(12) NOT NULL,
    "item_total" VARCHAR(12) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "return_status" INTEGER NOT NULL,

    CONSTRAINT "hps_return_item_pkey" PRIMARY KEY ("return_item_id")
);

-- CreateTable
CREATE TABLE "hps_roll_type" (
    "roll_id" SERIAL NOT NULL,
    "roll_type" VARCHAR(120) NOT NULL,

    CONSTRAINT "hps_roll_type_pkey" PRIMARY KEY ("roll_id")
);

-- CreateTable
CREATE TABLE "hps_sales_info" (
    "sales_info_id" SERIAL NOT NULL,
    "customer_name" INTEGER NOT NULL,
    "customer_address" VARCHAR(120) NOT NULL,
    "customer_contact" VARCHAR(120) NOT NULL,
    "sales_no_bags" VARCHAR(11) NOT NULL,
    "add_date" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_sales_info_pkey" PRIMARY KEY ("sales_info_id")
);

-- CreateTable
CREATE TABLE "hps_sales_item" (
    "sales_item_id" SERIAL NOT NULL,
    "sales_info_id" INTEGER NOT NULL,
    "complete_item_id" INTEGER NOT NULL,
    "barcode_no" VARCHAR(255) NOT NULL,
    "bundle_type" VARCHAR(255) NOT NULL,
    "n_weight" DOUBLE PRECISION NOT NULL,
    "no_of_bags" INTEGER NOT NULL,
    "item_price" VARCHAR(24) NOT NULL,
    "item_total" VARCHAR(24) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "sales_status" INTEGER NOT NULL,

    CONSTRAINT "hps_sales_item_pkey" PRIMARY KEY ("sales_item_id")
);

-- CreateTable
CREATE TABLE "hps_slitting" (
    "slitting_id" SERIAL NOT NULL,
    "job_card_id" INTEGER NOT NULL,
    "roll_barcode_no" VARCHAR(120) NOT NULL,
    "number_of_roll" INTEGER NOT NULL,
    "wastage" VARCHAR(12) NOT NULL,
    "wastage_width" VARCHAR(120) NOT NULL,
    "added_date" TIMESTAMP(3) NOT NULL,
    "update_date" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_slitting_pkey" PRIMARY KEY ("slitting_id")
);

-- CreateTable
CREATE TABLE "hps_slitting_roll" (
    "roll_id" SERIAL NOT NULL,
    "job_card_id" INTEGER NOT NULL,
    "slitting_id" INTEGER NOT NULL,
    "slitting_roll_weight" VARCHAR(12) NOT NULL,
    "slitting_roll_width" VARCHAR(120) NOT NULL,
    "slitting_barcode" VARCHAR(120) NOT NULL,
    "add_date" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_slitting_roll_pkey" PRIMARY KEY ("roll_id")
);

-- CreateTable
CREATE TABLE "hps_slitting_wastage" (
    "slitting_wastage_id" SERIAL NOT NULL,
    "job_card_id" INTEGER NOT NULL,
    "slitting_id" INTEGER NOT NULL,
    "slitting_wastage" VARCHAR(120) NOT NULL,
    "add_date" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "del_ind" INTEGER NOT NULL,

    CONSTRAINT "hps_slitting_wastage_pkey" PRIMARY KEY ("slitting_wastage_id")
);

-- CreateTable
CREATE TABLE "hps_stock" (
    "stock_id" SERIAL NOT NULL,
    "material_item_particular" INTEGER NOT NULL,
    "material_used_buy" INTEGER NOT NULL,
    "main_id" INTEGER NOT NULL,
    "material_item_id" INTEGER NOT NULL,
    "item_gsm" VARCHAR(12) NOT NULL,
    "stock_barcode" BIGINT NOT NULL,
    "material_item_size" VARCHAR(12) NOT NULL,
    "item_net_weight" VARCHAR(12) NOT NULL,
    "stock_date" TIMESTAMP(3) NOT NULL,
    "material_status" INTEGER NOT NULL,

    CONSTRAINT "hps_stock_pkey" PRIMARY KEY ("stock_id")
);

-- CreateTable
CREATE TABLE "hps_supplier" (
    "supplier_id" SERIAL NOT NULL,
    "supplier_name" VARCHAR(255) NOT NULL,
    "supplier_company" VARCHAR(255) NOT NULL,
    "supplier_contact_no" VARCHAR(255) NOT NULL,
    "supplier_email" VARCHAR(255) NOT NULL,
    "supplier_address" VARCHAR(255) NOT NULL,

    CONSTRAINT "hps_supplier_pkey" PRIMARY KEY ("supplier_id")
);

-- CreateTable
CREATE TABLE "hps_user_level" (
    "user_level_id" SERIAL NOT NULL,
    "user_level_name" VARCHAR(120) NOT NULL,

    CONSTRAINT "hps_user_level_pkey" PRIMARY KEY ("user_level_id")
);

-- CreateTable
CREATE TABLE "hps_bag_info" (
    "bag_info_id" SERIAL NOT NULL,
    "bag_supplier" INTEGER NOT NULL,
    "total_item" INTEGER NOT NULL,
    "total_net_weight" DOUBLE PRECISION NOT NULL,
    "hps_no_bag" INTEGER NOT NULL,
    "add_date" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "bag_info_status" INTEGER NOT NULL,

    CONSTRAINT "hps_bag_info_pkey" PRIMARY KEY ("bag_info_id")
);

-- CreateTable
CREATE TABLE "hps_bag_item" (
    "bag_item_id" SERIAL NOT NULL,
    "bag_info_id" INTEGER NOT NULL,
    "bag_item_no" VARCHAR(255) NOT NULL,
    "bag_item_color" VARCHAR(100) NOT NULL,
    "bag_item_gsm" VARCHAR(255) NOT NULL,
    "bag_item_size" VARCHAR(255) NOT NULL,
    "bag_item_net_weight" VARCHAR(255) NOT NULL,
    "bag_no_bag" VARCHAR(12) NOT NULL,
    "bag_type" VARCHAR(12) NOT NULL,
    "bag_item_barcode" VARCHAR(15) NOT NULL,
    "added_date" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "bag_status" INTEGER NOT NULL,

    CONSTRAINT "hps_bag_item_pkey" PRIMARY KEY ("bag_item_id")
);

-- CreateTable
CREATE TABLE "hps_handles_info" (
    "handles_info_id" SERIAL NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "total_net_weight" INTEGER NOT NULL,
    "no_of_handles" DOUBLE PRECISION NOT NULL,
    "add_date" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "handles_info_status" INTEGER NOT NULL,

    CONSTRAINT "hps_handles_info_pkey" PRIMARY KEY ("handles_info_id")
);

-- CreateTable
CREATE TABLE "hps_handles_item" (
    "handles_item_id" SERIAL NOT NULL,
    "handles_info_id" INTEGER NOT NULL,
    "handles_item_no" VARCHAR(255) NOT NULL,
    "handles_item_color" VARCHAR(100) NOT NULL,
    "handles_item_particular" VARCHAR(255) NOT NULL,
    "handles_item_length" VARCHAR(255) NOT NULL,
    "handles_item_net_weight" VARCHAR(255) NOT NULL,
    "handles_of_item" VARCHAR(12) NOT NULL,
    "handles_item_barcode" VARCHAR(15) NOT NULL,
    "added_date" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "handles_status" INTEGER NOT NULL,

    CONSTRAINT "hps_handles_item_pkey" PRIMARY KEY ("handles_item_id")
);

-- CreateTable
CREATE TABLE "hps_sheet_info" (
    "sheet_info_id" SERIAL NOT NULL,
    "sheet_supplier" INTEGER NOT NULL,
    "total_item" INTEGER NOT NULL,
    "total_net_weight" DOUBLE PRECISION NOT NULL,
    "total_gross_weight" VARCHAR(12) NOT NULL,
    "hps_sheetroll" INTEGER NOT NULL,
    "add_date" VARCHAR(255) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "sheet_info_status" INTEGER NOT NULL,

    CONSTRAINT "hps_sheet_info_pkey" PRIMARY KEY ("sheet_info_id")
);

-- CreateTable
CREATE TABLE "hps_sheet_item" (
    "sheet_item_id" SERIAL NOT NULL,
    "sheet_info_id" INTEGER NOT NULL,
    "sheet_item_no" VARCHAR(255) NOT NULL,
    "sheet_item_color" VARCHAR(100) NOT NULL,
    "sheet_item_particular" VARCHAR(255) NOT NULL,
    "sheet_item_variety" VARCHAR(255) NOT NULL,
    "sheet_item_gsm" VARCHAR(255) NOT NULL,
    "sheet_item_size" VARCHAR(255) NOT NULL,
    "sheet_item_net_weight" VARCHAR(255) NOT NULL,
    "sheet_item_gross_weight" VARCHAR(12) NOT NULL,
    "sheet_item_barcode" VARCHAR(15) NOT NULL,
    "added_date" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "sheet_status" INTEGER NOT NULL,

    CONSTRAINT "hps_sheet_item_pkey" PRIMARY KEY ("sheet_item_id")
);
