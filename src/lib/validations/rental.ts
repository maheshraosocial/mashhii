import { z } from "zod";
import { PropertyType, OccupancyStatus } from "@prisma/client";

export const propertySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.nativeEnum(PropertyType),
  address: z.string().min(1, "Address is required").max(300),
  floor: z.string().max(50).optional().nullable(),
  area: z.number().positive().optional().nullable(),
  occupancyStatus: z.nativeEnum(OccupancyStatus).default("VACANT"),
  monthlyRent: z.number().positive("Rent must be a positive number"),
  securityDeposit: z.number().positive().optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  amenities: z.array(z.string()).optional().default([]),
});

export const tenantSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().min(10, "Valid phone number required").max(15),
  alternatePhone: z.string().max(15).optional().nullable().or(z.literal("")),
  leaseStartDate: z.date({ required_error: "Lease start date is required" }),
  leaseEndDate: z.date().optional().nullable(),
  rentAmount: z.number().positive("Rent amount must be positive"),
  securityDeposit: z.number().positive().optional().nullable(),
  dueDate: z.number().int().min(1).max(28).default(1),
  notes: z.string().max(1000).optional().nullable(),
});

export const rentPaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  dueDate: z.date(),
  paidDate: z.date().optional().nullable(),
  paymentMethod: z.string().max(50).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type PropertyInput = z.infer<typeof propertySchema>;
export type TenantInput = z.infer<typeof tenantSchema>;
export type RentPaymentInput = z.infer<typeof rentPaymentSchema>;
