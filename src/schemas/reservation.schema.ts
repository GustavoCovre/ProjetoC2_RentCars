import { z } from 'zod'

export const createBookingSchema = z.object({
  carId: z.string().uuid('ID do veículo inválido'),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
