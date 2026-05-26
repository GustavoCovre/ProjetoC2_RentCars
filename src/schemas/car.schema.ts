import { z } from 'zod'

export const createCarSchema = z.object({
  model: z.string().min(1, 'Modelo obrigatório'),
  vin: z.string().min(5, 'VIN deve ter no mínimo 5 caracteres'),
  year: z.number().int().min(1900).max(new Date().getFullYear()),
  notes: z.string().optional(),
  brandId: z.string().uuid('ID da marca inválido'),
})

export const updateCarSchema = createCarSchema.partial()

export type CreateCarInput = z.infer<typeof createCarSchema>
export type UpdateCarInput = z.infer<typeof updateCarSchema>
