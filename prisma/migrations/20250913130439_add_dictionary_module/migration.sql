-- CreateEnum
CREATE TYPE "public"."Language" AS ENUM ('SPANISH', 'ENGLISH', 'RUSSIAN');

-- CreateTable
CREATE TABLE "public"."dictionary_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "source_language" "public"."Language" NOT NULL,
    "translation" TEXT NOT NULL,
    "target_language" "public"."Language" NOT NULL,
    "notes" TEXT,
    "difficulty" INTEGER DEFAULT 0,
    "times_viewed" INTEGER NOT NULL DEFAULT 0,
    "times_correct" INTEGER NOT NULL DEFAULT 0,
    "last_reviewed" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dictionary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dictionary_entries_user_id_idx" ON "public"."dictionary_entries"("user_id");

-- CreateIndex
CREATE INDEX "dictionary_entries_source_language_idx" ON "public"."dictionary_entries"("source_language");

-- CreateIndex
CREATE INDEX "dictionary_entries_target_language_idx" ON "public"."dictionary_entries"("target_language");

-- CreateIndex
CREATE INDEX "dictionary_entries_created_at_idx" ON "public"."dictionary_entries"("created_at");

-- CreateIndex
CREATE INDEX "dictionary_entries_user_id_source_language_idx" ON "public"."dictionary_entries"("user_id", "source_language");

-- CreateIndex
CREATE INDEX "dictionary_entries_user_id_word_idx" ON "public"."dictionary_entries"("user_id", "word");

-- Дополнительные индексы для фильтрации и поиска
CREATE INDEX "dictionary_entries_user_languages_idx" ON "public"."dictionary_entries"("user_id", "source_language", "target_language");

CREATE INDEX "dictionary_entries_created_at_desc_idx" ON "public"."dictionary_entries"("created_at" DESC);

CREATE INDEX "dictionary_entries_difficulty_idx" ON "public"."dictionary_entries"("difficulty") WHERE "difficulty" IS NOT NULL;

CREATE INDEX "dictionary_entries_last_reviewed_desc_idx" ON "public"."dictionary_entries"("last_reviewed" DESC) WHERE "last_reviewed" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."dictionary_entries" ADD CONSTRAINT "dictionary_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
