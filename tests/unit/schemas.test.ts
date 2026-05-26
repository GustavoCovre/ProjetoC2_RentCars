import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema } from '../../src/schemas/auth.schema.js'
import { createBrandSchema } from '../../src/schemas/author.schema.js'
import { createCarSchema } from '../../src/schemas/car.schema.js'
import { createRentalSchema } from '../../src/schemas/loan.schema.js'
import { createBookingSchema } from '../../src/schemas/reservation.schema.js'

describe('registerSchema', () => {
  it('deve aceitar dados válidos', () => {
    const result = registerSchema.safeParse({
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'senha123',
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar e-mail inválido', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'nao-é-email',
      password: 'senha123',
    })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar senha curta', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'joao@email.com',
      password: '123',
    })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar nome muito curto', () => {
    const result = registerSchema.safeParse({
      name: 'J',
      email: 'joao@email.com',
      password: 'senha123',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('deve aceitar dados válidos', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: 'senha' })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar sem e-mail', () => {
    const result = loginSchema.safeParse({ password: 'senha123' })
    expect(result.success).toBe(false)
  })
})

describe('createBrandSchema', () => {
  it('deve aceitar nome válido', () => {
    const result = createBrandSchema.safeParse({ name: 'Locadora XYZ', description: 'Marca de veículos' })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar nome vazio', () => {
    const result = createBrandSchema.safeParse({ name: 'J' })
    expect(result.success).toBe(false)
  })
})

describe('createCarSchema', () => {
  const validCar = {
    model: 'Fiat Uno',
    vin: '1HGCM82633A004352',
    year: 2020,
    brandId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  }

  it('deve aceitar dados válidos', () => {
    const result = createCarSchema.safeParse(validCar)
    expect(result.success).toBe(true)
  })

  it('deve rejeitar VIN curto', () => {
    const result = createCarSchema.safeParse({ ...validCar, vin: '123' })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar brandId inválido (não UUID)', () => {
    const result = createCarSchema.safeParse({ ...validCar, brandId: 'nao-uuid' })
    expect(result.success).toBe(false)
  })
})

describe('createRentalSchema', () => {
  it('deve aceitar dados válidos', () => {
    const result = createRentalSchema.safeParse({
      carId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar carId inválido', () => {
    const result = createRentalSchema.safeParse({ carId: 'nao-uuid', dueDate: new Date().toISOString() })
    expect(result.success).toBe(false)
  })
})

describe('createBookingSchema', () => {
  it('deve aceitar carId UUID válido', () => {
    const result = createBookingSchema.safeParse({ carId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar carId inválido', () => {
    const result = createBookingSchema.safeParse({ carId: 'invalido' })
    expect(result.success).toBe(false)
  })
})
