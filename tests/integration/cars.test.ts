import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { buildApiApp } from '../../src/app.js'

const app = buildApiApp()

async function getAdminToken() {
  await request(app).post('/auth/register').send({ name: 'Admin', email: 'admin@test.com', password: 'admin123' })
  const { prisma } = await import('../../src/lib/prisma.js')
  await prisma.user.update({ where: { email: 'admin@test.com' }, data: { role: 'ADMIN' } })
  const login = await request(app).post('/auth/login').send({ email: 'admin@test.com', password: 'admin123' })
  return login.body.token as string
}

async function createBrandAndCar(token: string) {
  const brand = await request(app)
    .post('/brands')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Marca Teste', description: 'Fabricante de veículos' })

  const car = await request(app)
    .post('/cars')
    .set('Authorization', `Bearer ${token}`)
    .send({ model: 'Uno', vin: '1HGCM82633A004352', year: 2020, brandId: brand.body.id })

  return { brand: brand.body, car: car.body }
}

describe('GET /cars', () => {
  it('deve listar veículos publicamente com marca', async () => {
    const res = await request(app).get('/cars')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('POST /cars', () => {
  it('deve criar veículo como ADMIN com relacionamento', async () => {
    const token = await getAdminToken()
    const { car } = await createBrandAndCar(token)
    expect(car.id).toBeDefined()
    expect(car.brand).toHaveProperty('name')
  })

  it('deve retornar 404 para marca inexistente', async () => {
    const token = await getAdminToken()
    const res = await request(app)
      .post('/cars')
      .set('Authorization', `Bearer ${token}`)
      .send({ model: 'Uno', vin: '1HGCM82633A004352', year: 2020, brandId: '00000000-0000-0000-0000-000000000000' })
    expect(res.status).toBe(404)
  })

  it('deve retornar 403 para USER', async () => {
    await request(app).post('/auth/register').send({ name: 'User', email: 'user@test.com', password: 'user123' })
    const login = await request(app).post('/auth/login').send({ email: 'user@test.com', password: 'user123' })
    const res = await request(app)
      .post('/cars')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ model: 'Uno', vin: '1HGCM82633A004352', year: 2020, brandId: '00000000-0000-0000-0000-000000000000' })
    expect(res.status).toBe(403)
  })
})

describe('GET /cars/:id', () => {
  it('deve retornar veículo com marca e relacionamentos', async () => {
    const token = await getAdminToken()
    const { car } = await createBrandAndCar(token)
    const res = await request(app).get(`/cars/${car.id}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('brand')
    expect(res.body).toHaveProperty('rentals')
    expect(res.body).toHaveProperty('bookings')
  })

  it('deve retornar 404 para veículo inexistente', async () => {
    const res = await request(app).get('/cars/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})

describe('PUT /cars/:id', () => {
  it('deve atualizar veículo como ADMIN', async () => {
    const token = await getAdminToken()
    const { car } = await createBrandAndCar(token)
    const res = await request(app)
      .put(`/cars/${car.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ model: 'Uno Novo' })
    expect(res.status).toBe(200)
    expect(res.body.model).toBe('Uno Novo')
  })
})

describe('DELETE /cars/:id', () => {
  it('deve deletar veículo como ADMIN', async () => {
    const token = await getAdminToken()
    const { car } = await createBrandAndCar(token)
    const res = await request(app)
      .delete(`/cars/${car.id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(204)
  })
})
