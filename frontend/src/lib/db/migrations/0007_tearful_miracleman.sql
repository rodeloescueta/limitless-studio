CREATE TABLE "card_checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"template_id" uuid,
	"title" varchar(200) NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"completed_by" uuid,
	"is_custom" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stage_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_required" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card_checklist_items" ADD CONSTRAINT "card_checklist_items_card_id_content_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."content_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_checklist_items" ADD CONSTRAINT "card_checklist_items_template_id_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."checklist_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_checklist_items" ADD CONSTRAINT "card_checklist_items_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_checklist_items_card_idx" ON "card_checklist_items" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "card_checklist_items_template_idx" ON "card_checklist_items" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "card_checklist_items_card_position_idx" ON "card_checklist_items" USING btree ("card_id","position");--> statement-breakpoint
CREATE INDEX "checklist_templates_stage_idx" ON "checklist_templates" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "checklist_templates_stage_position_idx" ON "checklist_templates" USING btree ("stage_id","position");