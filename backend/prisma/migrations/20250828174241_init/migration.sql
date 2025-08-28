-- CreateTable
CREATE TABLE "user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL,
    "hashed_password" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "position" TEXT,
    "address" TEXT,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "skip_two_factor_until" DATETIME
);

-- CreateTable
CREATE TABLE "notification_preference" (
    "user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email_enabled" BOOLEAN NOT NULL DEFAULT false,
    "push_enabled" BOOLEAN NOT NULL DEFAULT false,
    "matrix" JSONB,
    CONSTRAINT "notification_preference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "employee_id" TEXT NOT NULL,
    "department" TEXT,
    "skills" TEXT NOT NULL,
    "max_tickets" INTEGER NOT NULL DEFAULT 10,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "primary_subcategory_id" INTEGER,
    CONSTRAINT "agent_primary_subcategory_id_fkey" FOREIGN KEY ("primary_subcategory_id") REFERENCES "subcategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "agent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_category" (
    "agent_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    CONSTRAINT "agent_category_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "agent_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "company" TEXT,
    "client_type" TEXT NOT NULL DEFAULT 'Individual',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL,
    "address" TEXT,
    "admission_date" DATETIME,
    "birth_date" DATETIME,
    "contract_type" TEXT,
    "cpf" TEXT,
    "department" TEXT,
    "education_field" TEXT,
    "education_level" TEXT,
    "gender" TEXT,
    "notes" TEXT,
    "position" TEXT,
    "work_schedule" TEXT,
    "matricu_id" TEXT,
    CONSTRAINT "client_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "icon" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "subcategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL,
    CONSTRAINT "subcategory_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ticket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticket_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "category_id" INTEGER NOT NULL,
    "subcategory_id" INTEGER,
    "client_id" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,
    "assigned_to" INTEGER,
    "due_date" DATETIME,
    "resolution_time" INTEGER,
    "satisfaction_rating" INTEGER,
    "location" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL,
    "closed_at" DATETIME,
    CONSTRAINT "ticket_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ticket_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ticket_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ticket_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ticket_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticket_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL,
    CONSTRAINT "comment_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attachment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "ticket_id" INTEGER,
    "comment_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attachment_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attachment_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ticket_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticket_id" INTEGER NOT NULL,
    "field_name" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ticket_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ticket_assignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticket_id" INTEGER NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "assigned_by" INTEGER NOT NULL,
    "assigned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" DATETIME,
    CONSTRAINT "ticket_assignment_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ticket_assignment_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ticket_assignment_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ticket_assignment_request" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticket_id" INTEGER NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "requested_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" DATETIME,
    "response_note" TEXT,
    CONSTRAINT "ticket_assignment_request_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ticket_assignment_request_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "response_template" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL,
    CONSTRAINT "response_template_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sla" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL,
    "response_time" INTEGER NOT NULL,
    "resolution_time" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ticket_statistics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "total_tickets" INTEGER NOT NULL DEFAULT 0,
    "open_tickets" INTEGER NOT NULL DEFAULT 0,
    "resolved_tickets" INTEGER NOT NULL DEFAULT 0,
    "closed_tickets" INTEGER NOT NULL DEFAULT 0,
    "avg_resolution_time" REAL NOT NULL DEFAULT 0,
    "avg_satisfaction" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "metadata" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "read_at" DATETIME,
    "archived_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_evaluation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "agent_id" INTEGER NOT NULL,
    "evaluator_id" INTEGER NOT NULL,
    "evaluation_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "technical_skills" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "problem_solving" INTEGER NOT NULL,
    "teamwork" INTEGER NOT NULL,
    "punctuality" INTEGER NOT NULL,
    "overall_rating" INTEGER NOT NULL,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "recommendations" TEXT,
    "comments" TEXT,
    "is_confidential" BOOLEAN NOT NULL DEFAULT false,
    "is_acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" DATETIME NOT NULL,
    CONSTRAINT "agent_evaluation_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "agent_evaluation_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_id_key" ON "user"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_role_is_active_idx" ON "user"("role", "is_active");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "agent_id_key" ON "agent"("id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_user_id_key" ON "agent"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_employee_id_key" ON "agent"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_category_id_key" ON "agent_category"("id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_category_agent_id_category_id_key" ON "agent_category"("agent_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_id_key" ON "client"("id");

-- CreateIndex
CREATE UNIQUE INDEX "client_user_id_key" ON "client"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_cpf_key" ON "client"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "client_matricu_id_key" ON "client"("matricu_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_id_key" ON "category"("id");

-- CreateIndex
CREATE UNIQUE INDEX "category_name_key" ON "category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subcategory_id_key" ON "subcategory"("id");

-- CreateIndex
CREATE UNIQUE INDEX "subcategory_name_category_id_key" ON "subcategory"("name", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_id_key" ON "ticket"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_ticket_number_key" ON "ticket"("ticket_number");

-- CreateIndex
CREATE INDEX "ticket_status_priority_idx" ON "ticket"("status", "priority");

-- CreateIndex
CREATE INDEX "ticket_client_id_status_idx" ON "ticket"("client_id", "status");

-- CreateIndex
CREATE INDEX "ticket_assigned_to_status_idx" ON "ticket"("assigned_to", "status");

-- CreateIndex
CREATE INDEX "ticket_category_id_idx" ON "ticket"("category_id");

-- CreateIndex
CREATE INDEX "ticket_created_at_idx" ON "ticket"("created_at");

-- CreateIndex
CREATE INDEX "ticket_modified_at_idx" ON "ticket"("modified_at");

-- CreateIndex
CREATE INDEX "ticket_status_created_at_idx" ON "ticket"("status", "created_at");

-- CreateIndex
CREATE INDEX "ticket_priority_created_at_idx" ON "ticket"("priority", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "comment_id_key" ON "comment"("id");

-- CreateIndex
CREATE UNIQUE INDEX "attachment_id_key" ON "attachment"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_history_id_key" ON "ticket_history"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_assignment_id_key" ON "ticket_assignment"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_assignment_request_id_key" ON "ticket_assignment_request"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_assignment_request_ticket_id_agent_id_key" ON "ticket_assignment_request"("ticket_id", "agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_id_key" ON "system_settings"("id");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "system_settings"("setting_key");

-- CreateIndex
CREATE UNIQUE INDEX "response_template_id_key" ON "response_template"("id");

-- CreateIndex
CREATE UNIQUE INDEX "response_template_name_key" ON "response_template"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sla_id_key" ON "sla"("id");

-- CreateIndex
CREATE UNIQUE INDEX "sla_name_key" ON "sla"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_statistics_id_key" ON "ticket_statistics"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_statistics_date_key" ON "ticket_statistics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "notification_id_key" ON "notification"("id");

-- CreateIndex
CREATE INDEX "notification_user_id_is_read_idx" ON "notification"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notification_user_id_created_at_idx" ON "notification"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notification_type_created_at_idx" ON "notification"("type", "created_at");

-- CreateIndex
CREATE INDEX "notification_user_id_is_read_created_at_idx" ON "notification"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "agent_evaluation_id_key" ON "agent_evaluation"("id");

-- CreateIndex
CREATE INDEX "agent_evaluation_agent_id_evaluation_date_idx" ON "agent_evaluation"("agent_id", "evaluation_date");

-- CreateIndex
CREATE INDEX "agent_evaluation_evaluator_id_evaluation_date_idx" ON "agent_evaluation"("evaluator_id", "evaluation_date");
