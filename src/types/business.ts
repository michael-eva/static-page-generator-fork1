import { z } from "zod";

export const BusinessInfoSchema = z.object({
  userId: z.string(),
  name: z.string().min(1, "Business name is required"),
  htmlSrc: z.string(),
  description: z.string().min(1, "Description is required"),
  offerings: z.array(z.string().min(1, "Offering cannot be empty")),
  location: z.string(),
  images: z.array(
    z.object({
      url: z.string(),
      description: z.string(),
      metadata: z.object({
        width: z.number(),
        height: z.number(),
        aspectRatio: z.number(),
      }),
    })
  ),
  design_preferences: z.object({
    style: z.string().optional(),
    color_palette: z.string().optional(),
  }),
  contact_preferences: z.object({
    type: z.enum(["form", "email", "phone", "subscribe", ""]),
    business_hours: z.string(),
    contact_email: z.string().refine(
      (email) => {
        const contactType = (email as any).parent?.type;
        if (["form", "email", "subscribe"].includes(contactType)) {
          return (
            email && email.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i)
          );
        }
        return true;
      },
      { message: "Invalid email address" }
    ),
    contact_phone: z.string(),
  }),
  branding: z.object({
    logo_url: z.string().optional(),
    logo_metadata: z
      .object({
        width: z.number(),
        height: z.number(),
        aspectRatio: z.number(),
      })
      .optional(),
    tagline: z.string().optional(),
  }),
});

export type BusinessInfo = z.infer<typeof BusinessInfoSchema>;
