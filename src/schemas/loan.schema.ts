import { z } from 'zod'

export const createRentalSchema = z.object({
  carId: z.string().uuid('ID do veículo inválido'),
  dueDate: z.string().datetime({ message: 'Data de devolução inválida (use ISO 8601)' }),
})

export type CreateRentalInput = z.infer<typeof createRentalSchema>
