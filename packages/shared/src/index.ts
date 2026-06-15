import { z } from "zod";

export const UserRoleSchema = z.enum(["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const AssignmentStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "CANCELLED",
  "REASSIGNED"
]);
export type AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;

export const AvailabilityTypeSchema = z.enum(["AVAILABLE", "UNAVAILABLE", "BLOCKED"]);
export type AvailabilityType = z.infer<typeof AvailabilityTypeSchema>;

export const IntegrationServiceSchema = z.enum([
  "DYNAMICS",
  "SENDGRID",
  "TWILIO",
  "PUSH",
  "DATABASE",
  "REDIS"
]);
export type IntegrationService = z.infer<typeof IntegrationServiceSchema>;

export const IntegrationStatusSchema = z.enum([
  "NOT_CONFIGURED",
  "CONFIGURED_NOT_VALIDATED",
  "CONNECTED",
  "WARNING",
  "ERROR",
  "MAPPING_ERROR",
  "CONNECTION_ERROR"
]);
export type IntegrationStatus = z.infer<typeof IntegrationStatusSchema>;

export const CourseStatusSchema = z.enum([
  "DRAFT",
  "SCHEDULED",
  "CANCELLED",
  "COMPLETED"
]);
export type CourseStatus = z.infer<typeof CourseStatusSchema>;

export const DeliveryTypeSchema = z.enum(["IN_PERSON", "VIRTUAL", "HYBRID"]);
export type DeliveryType = z.infer<typeof DeliveryTypeSchema>;

export const ConflictStrategySchema = z.enum([
  "dynamics_wins",
  "application_wins",
  "newest_update_wins",
  "manual_admin_review"
]);
export type ConflictStrategy = z.infer<typeof ConflictStrategySchema>;

export const ApiEnvelopeSchema = <T extends z.ZodTypeAny>(payload: T) =>
  z.object({
    data: payload,
    requestId: z.string().optional()
  });

export const AvailabilityInputSchema = z
  .object({
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    type: AvailabilityTypeSchema,
    note: z.string().max(1000).optional(),
    timezone: z.string().default("America/Toronto")
  })
  .refine((value) => value.startsAt < value.endsAt, {
    message: "Start time must be before end time",
    path: ["endsAt"]
  });

export const AssignmentResponseSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED"]),
  declineReason: z.string().max(1000).optional()
});

export const PhoneNumberSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, "Phone numbers must be normalized E.164 values");

export const EmailSchema = z.string().email().transform((value) => value.toLowerCase());
