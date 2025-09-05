import { z } from "zod"

// Company information validation schema
export const companyInfoSchema = z.object({
  name: z.string().min(1, "Company name is required").max(100, "Company name too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format"),
  timezone: z.string(),
  address: z.string().min(1, "Address is required").max(500, "Address too long"),
})

// API key validation schemas
export const shopifyIntegrationSchema = z.object({
  storeUrl: z.string()
    .regex(/^[a-zA-Z0-9\-]+\.myshopify\.com$/, "Invalid Shopify store URL format"),
  apiKey: z.string()
    .min(32, "API key must be at least 32 characters")
    .max(256, "API key too long")
    .regex(/^[a-zA-Z0-9_\-]+$/, "API key contains invalid characters"),
})

export const courierIntegrationSchema = z.object({
  courier: z.enum(["fedex", "ups", "dhl", "usps"], {
    errorMap: () => ({ message: "Please select a valid courier" })
  }),
  apiKey: z.string()
    .min(16, "API credentials must be at least 16 characters")
    .max(256, "API credentials too long"),
})

// Security settings validation
export const securitySettingsSchema = z.object({
  sessionTimeout: z.enum(["30", "60", "120", "480"]),
  twoFactorEnabled: z.boolean(),
  auditLoggingEnabled: z.boolean(),
  ipWhitelistEnabled: z.boolean(),
})

// System preferences validation
export const systemPreferencesSchema = z.object({
  defaultOrderPriority: z.enum(["low", "normal", "high"]),
  autoAssignOrders: z.boolean(),
  barcodeScanning: z.boolean(),
})

export type CompanyInfo = z.infer<typeof companyInfoSchema>
export type ShopifyIntegration = z.infer<typeof shopifyIntegrationSchema>
export type CourierIntegration = z.infer<typeof courierIntegrationSchema>
export type SecuritySettings = z.infer<typeof securitySettingsSchema>
export type SystemPreferences = z.infer<typeof systemPreferencesSchema>