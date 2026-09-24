import { z } from 'zod';

export const studyEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  location: z.string().optional(),
  type: z.enum(['fair', 'meeting', 'visit', 'other']),
  notes: z.string().optional(),
});

export const productStudySchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional(),
  productName: z.string().min(3, 'Nome do produto é obrigatório'),
  companyName: z.string().min(2, 'Nome da empresa é obrigatório'),
  origin: z.enum(['national', 'international']),
  definitions: z.string().optional(),
  composition: z.string().optional(),
  usage: z.string().optional(),
  internalContact: z.object({
    name: z.string().optional(),
    phones: z.array(z.string()).optional(),
    email: z.string().email().optional().or(z.literal('')),
  }).optional(),
  reliability: z.enum(['high', 'medium', 'low', 'unreliable']),
  businessObservations: z.string().optional(),
  history: z.array(z.object({
    date: z.string(),
    event: z.string(),
    notes: z.string().optional(),
  })).optional(),
  events: z.array(studyEventSchema).optional(),
  evaluationLogs: z.array(z.object({
    id: z.string(),
    date: z.string(),
    userName: z.string(),
    observation: z.string(),
  })).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ProductStudy = z.infer<typeof productStudySchema>;
export type StudyEvent = z.infer<typeof studyEventSchema>;
