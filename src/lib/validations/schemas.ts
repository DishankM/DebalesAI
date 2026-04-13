import { z } from "zod";

export const SendMessageSchema = z.object({
  conversationId: z.string().optional(),
  content: z.string().min(1, "Message cannot be empty").max(4000),
  projectId: z.string().min(1),
  productInstanceId: z.string().min(1),
});

/** Empty strings from the client are treated as “use session / default product instance”. */
const optionalId = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : v),
  z.string().min(1).optional()
);

export const CreateConversationSchema = z.object({
  projectId: optionalId,
  productInstanceId: optionalId,
  title: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const UpdateIntegrationsSchema = z.object({
  shopify: z.object({ enabled: z.boolean() }).optional(),
  crm: z.object({ enabled: z.boolean() }).optional(),
});

export const UpdateDashboardConfigSchema = z.object({
  title: z.string().optional(),
  theme: z.enum(["dark", "light"]).optional(),
  sections: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        order: z.number(),
        widgets: z.array(
          z.object({
            id: z.string(),
            type: z.string(),
            title: z.string(),
            size: z.enum(["sm", "md", "lg", "full"]),
            order: z.number(),
            visible: z.boolean(),
            config: z.record(z.unknown()).optional(),
          })
        ),
      })
    )
    .optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateIntegrationsInput = z.infer<typeof UpdateIntegrationsSchema>;
export type UpdateDashboardConfigInput = z.infer<typeof UpdateDashboardConfigSchema>;
