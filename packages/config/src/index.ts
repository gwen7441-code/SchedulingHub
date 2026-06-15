import { z } from "zod";

const boolFromString = z
  .string()
  .optional()
  .transform((value) => value === "true");

export const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  APP_NAME: z.string().default("First Aid Instructor Scheduler"),
  COMPANY_NAME: z.string().optional(),
  COMPANY_LOGO_URL: z.string().url().optional().or(z.literal("")),
  SUPPORT_EMAIL: z.string().email().optional().or(z.literal("")),
  ADMIN_EMAILS: z.string().optional(),
  DEFAULT_TIMEZONE: z.string().default("America/Toronto"),
  COMPANY_PRIMARY_COLOUR: z.string().default("#0F766E"),
  COMPANY_SECONDARY_COLOUR: z.string().default("#164E63"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("30d"),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional().or(z.literal("")),
  SENDGRID_FROM_NAME: z.string().optional(),
  SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY: z.string().optional(),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  EXPO_PROJECT_ID: z.string().optional(),
  DYNAMICS_ENABLED: boolFromString,
  DYNAMICS_TENANT_ID: z.string().optional(),
  DYNAMICS_CLIENT_ID: z.string().optional(),
  DYNAMICS_CLIENT_SECRET: z.string().optional(),
  DYNAMICS_CERTIFICATE_PATH: z.string().optional(),
  DYNAMICS_CERTIFICATE_THUMBPRINT: z.string().optional(),
  DYNAMICS_ORG_URL: z.string().url().optional().or(z.literal("")),
  DYNAMICS_API_VERSION: z.string().default("9.2"),
  DYNAMICS_MAPPING_FILE: z.string().default("config/dynamics-mapping.example.json"),
  DYNAMICS_WEBHOOK_SECRET: z.string().optional(),
  DYNAMICS_SYNC_INTERVAL_MINUTES: z.coerce.number().int().positive().default(15),
  DYNAMICS_DEFAULT_CONFLICT_STRATEGY: z
    .enum(["dynamics_wins", "application_wins", "newest_update_wins", "manual_admin_review"])
    .default("manual_admin_review"),
  CORS_ALLOWED_ORIGINS: z.string().default(""),
  API_PUBLIC_URL: z.string().url(),
  MOBILE_DEEP_LINK_SCHEME: z.string().default("firstaidscheduler"),
  PASSWORD_RESET_URL: z.string().url(),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info")
});

export type AppConfig = z.infer<typeof EnvSchema>;

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  return EnvSchema.parse(source);
}

export function safeParseConfig(source: NodeJS.ProcessEnv = process.env) {
  return EnvSchema.safeParse(source);
}
