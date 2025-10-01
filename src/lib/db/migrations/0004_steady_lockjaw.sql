CREATE TYPE "public"."alert_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('open', 'acknowledged', 'resolved', 'escalated', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('stage_overdue', 'deadline_missed', 'no_response', 'manual');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_card_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"type" "alert_type" NOT NULL,
	"severity" "alert_severity" DEFAULT 'medium' NOT NULL,
	"status" "alert_status" DEFAULT 'open' NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"assigned_to" uuid,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp,
	"resolved_at" timestamp,
	"escalated_at" timestamp,
	"escalated_to" uuid,
	"escalation_reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stage_time_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"stage_name" varchar(100) NOT NULL,
	"max_days" integer NOT NULL,
	"is_global" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_content_card_id_content_cards_id_fk" FOREIGN KEY ("content_card_id") REFERENCES "public"."content_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_escalated_to_users_id_fk" FOREIGN KEY ("escalated_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_time_configs" ADD CONSTRAINT "stage_time_configs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alerts_card_idx" ON "alerts" USING btree ("content_card_id");--> statement-breakpoint
CREATE INDEX "alerts_team_idx" ON "alerts" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "alerts_status_idx" ON "alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "alerts_severity_idx" ON "alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "alerts_assigned_to_idx" ON "alerts" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "stage_time_configs_team_stage_idx" ON "stage_time_configs" USING btree ("team_id","stage_name");