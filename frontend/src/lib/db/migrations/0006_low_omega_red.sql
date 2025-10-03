CREATE TYPE "public"."card_status" AS ENUM('not_started', 'in_progress', 'blocked', 'ready_for_review', 'completed');--> statement-breakpoint
CREATE TYPE "public"."content_format" AS ENUM('short', 'long');--> statement-breakpoint
ALTER TABLE "content_cards" ADD COLUMN "content_format" "content_format" DEFAULT 'short';--> statement-breakpoint
ALTER TABLE "content_cards" ADD COLUMN "status" "card_status" DEFAULT 'not_started';--> statement-breakpoint
ALTER TABLE "content_cards" ADD COLUMN "client_id" uuid;--> statement-breakpoint
ALTER TABLE "content_cards" ADD COLUMN "due_window_start" timestamp;--> statement-breakpoint
ALTER TABLE "content_cards" ADD COLUMN "due_window_end" timestamp;--> statement-breakpoint
ALTER TABLE "content_cards" ADD CONSTRAINT "content_cards_client_id_teams_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_cards_client_idx" ON "content_cards" USING btree ("client_id");