CREATE TYPE "public"."sale_status" AS ENUM('draft', 'published', 'hidden');--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "status" "sale_status" DEFAULT 'draft' NOT NULL;