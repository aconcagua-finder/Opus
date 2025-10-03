-- CreateEnum
CREATE TYPE "public"."WordListType" AS ENUM ('CUSTOM', 'AUTO_7_DAYS', 'AUTO_14_DAYS', 'AUTO_28_DAYS');

-- DropIndex
DROP INDEX "public"."dictionary_entries_created_at_desc_idx";

-- DropIndex
DROP INDEX "public"."dictionary_entries_user_languages_idx";

-- CreateTable
CREATE TABLE "public"."word_lists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."WordListType" NOT NULL DEFAULT 'CUSTOM',
    "description" TEXT,
    "color" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "word_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."word_list_items" (
    "id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "word_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "word_lists_user_id_idx" ON "public"."word_lists"("user_id");

-- CreateIndex
CREATE INDEX "word_lists_user_id_type_idx" ON "public"."word_lists"("user_id", "type");

-- CreateIndex
CREATE INDEX "word_lists_user_id_is_archived_idx" ON "public"."word_lists"("user_id", "is_archived");

-- CreateIndex
CREATE INDEX "word_list_items_list_id_idx" ON "public"."word_list_items"("list_id");

-- CreateIndex
CREATE INDEX "word_list_items_entry_id_idx" ON "public"."word_list_items"("entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "word_list_items_list_id_entry_id_key" ON "public"."word_list_items"("list_id", "entry_id");

-- AddForeignKey
ALTER TABLE "public"."word_lists" ADD CONSTRAINT "word_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."word_list_items" ADD CONSTRAINT "word_list_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."word_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."word_list_items" ADD CONSTRAINT "word_list_items_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."dictionary_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
