import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { buildApiApp } from '../../src/app.js'

const app = buildApiApp()

async function setupUsers() {
  await request(app).post('/auth/register').send({ name: 'Admin', email: 'admin@test.com', password: 'admin123' })
  await request(app).post('/auth/register').send({ name: 'User A', email: 'usera@test.com', password: 'user123' })
  await request(app).post('/auth/register').send({ name: 'User B', email: 'userb@test.com', password: 'user123' })
  const { prisma } = await import('../../src/lib/prisma.js')
  await prisma.user.update({ where: { email: 'admin@test.com' }, data: { role: 'ADMIN' } })
  const adminLogin = await request(app).post('/auth/login').send({ email: 'admin@test.com', password: 'admin123' })
  const userALogin = await request(app).post('/auth/login').send({ email: 'usera@test.com', password: 'user123' })
  const userBLogin = await request(app).post('/auth/login').send({ email: 'userb@test.com', password: 'user123' })
  return {
    adminToken: adminLogin.body.token as string,
    userAToken: userALogin.body.token as string,
    userBToken: userBLogin.body.token as string,
  }
}

async function createBrandAndCar(adminToken: string) {
  const brand = await request(app)
    .post('/brands')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Marca Reserva', description: 'Marca para testes de reservas' })
  const car = await request(app)
    .post('/cars')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ model: 'Ka', vin: '3HGCM82633A004354', year: 2022, brandId: brand.body.id })
  return car.body
}

describe('POST /bookings', () => {
  it('deve criar reserva com sucesso', async () => {
    const { adminToken, userAToken } = await setupUsers()
    const car = await createBrandAndCar(adminToken)
    const res = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ carId: car.id })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('PENDING')
  })

  it('deve impedir reserva duplicada pendente', async () => {
    const { adminToken, userAToken } = await setupUsers()
    const car = await createBrandAndCar(adminToken)
    await request(app).post('/bookings').set('Authorization', `Bearer ${userAToken}`).send({ carId: car.id })
    const res = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ carId: car.id })
    expect(res.status).toBe(400)
  })

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).post('/bookings').send({ carId: '00000000-0000-0000-0000-000000000000' })
    expect(res.status).toBe(401)
  })
})

describe('DELETE /bookings/:id (cancelamento com controle de propriedade)', () => {
  it('dono pode cancelar sua própria reserva', async () => {
    const { adminToken, userAToken } = await setupUsers()
    const car = await createBrandAndCar(adminToken)
    const booking = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ carId: car.id })
    const res = await request(app)
      .delete(`/bookings/${booking.body.id}`)
      .set('Authorization', `Bearer ${userAToken}`)
    expect(res.status).toBe(204)
  })

  it('USER não pode cancelar reserva de outro USER - retorna 403', async () => {
    const { adminToken, userAToken, userBToken } = await setupUsers()
    const car = await createBrandAndCar(adminToken)
    const booking = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ carId: car.id })
    const res = await request(app)
      .delete(`/bookings/${booking.body.id}`)
      .set('Authorization', `Bearer ${userBToken}`)
    expect(res.status).toBe(403)
  })

  it('ADMIN pode cancelar qualquer reserva', async () => {
    const { adminToken, userAToken } = await setupUsers()
    const car = await createBrandAndCar(adminToken)
    const booking = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ carId: car.id })
    const res = await request(app)
      .delete(`/bookings/${booking.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(204)
  })
})

describe('PATCH /bookings/:id/confirm', () => {
  it('ADMIN pode confirmar reserva pendente', async () => {
    const { adminToken, userAToken } = await setupUsers()
    const car = await createBrandAndCar(adminToken)
    const booking = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ carId: car.id })
    const res = await request(app)
      .patch(`/bookings/${booking.body.id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('CONFIRMED')
  })

  it('USER não pode confirmar reserva - retorna 403', async () => {
    const { adminToken, userAToken } = await setupUsers()
    const car = await createBrandAndCar(adminToken)
    const booking = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ carId: car.id })
    const res = await request(app)
      .patch(`/bookings/${booking.body.id}/confirm`)
      .set('Authorization', `Bearer ${userAToken}`)
    expect(res.status).toBe(403)
  })
})
