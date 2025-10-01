CREATE TABLE "client_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"brand_bio" text,
	"brand_voice" text,
	"target_audience" text,
	"content_pillars" jsonb,
	"style_guidelines" jsonb,
	"asset_links" jsonb,
	"competitive_channels" jsonb,
	"performance_goals" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_profiles_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "client_company_name" varchar(200);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "industry" varchar(100);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "contact_email" varchar(255);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "is_client" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_profiles_team_idx" ON "client_profiles" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "teams_client_idx" ON "teams" USING btree ("is_client");