import { z } from "zod/v3";

export const generatedRegistrationUserSchema = z
  .object({
    firstName: z.string().min(2).max(40),
    lastName: z.string().min(2).max(40),
    email: z.string().min(6).max(80),
    password: z.string().min(12).max(32),
    company: z.string().min(3).max(80),
    role: z.enum(["QA Engineer", "QA Lead", "Engineering Manager", "Product Owner"]),
    country: z.enum(["Brazil", "United States", "Portugal", "Canada"])
  })
  .strict();

export const registrationUserSchema = generatedRegistrationUserSchema.superRefine((user, context) => {
  if (!user.email.endsWith("@example.test")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["email"],
      message: "Synthetic users must use the example.test domain."
    });
  }

  if (!/[A-Z]/.test(user.password) || !/[a-z]/.test(user.password) || !/\d/.test(user.password) || !/[^A-Za-z0-9]/.test(user.password)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: "Password must include uppercase, lowercase, number and symbol."
    });
  }
});

export type RegistrationUser = z.infer<typeof registrationUserSchema>;

export const sanitizeRegistrationUser = (user: RegistrationUser): Omit<RegistrationUser, "password"> & { password: string } => ({
  ...user,
  password: "[redacted]"
});
