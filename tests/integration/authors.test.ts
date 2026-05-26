import { describe, it, expect, beforeAll } from 'vitest'
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

async function getUserToken() {
  await request(app).post('/auth/register').send({ name: 'User', email: 'user@test.com', password: 'user123' })
  const login = await request(app).post('/auth/login').send({ email: 'user@test.com', password: 'user123' })
  return login.body.token as string
}

describe('GET /brands', () => {
  it('deve listar marcas publicamente', async () => {
    const res = await request(app).get('/brands')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('POST /brands', () => {
  it('deve criar marca como ADMIN', async () => {
    const token = await getAdminToken()
    const res = await request(app)
      .post('/brands')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Marca Teste', description: 'Fabricante de veículos' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Marca Teste')
  })

  it('deve retornar 403 para USER tentando criar marca', async () => {
    const token = await getUserToken()
    const res = await request(app)
      .post('/brands')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Marca Qualquer' })
    expect(res.status).toBe(403)
  })

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).post('/brands').send({ name: 'Marca' })
    expect(res.status).toBe(401)
  })

  it('deve rejeitar dados inválidos', async () => {
    const token = await getAdminToken()
    const res = await request(app)
      .post('/brands')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A' })
    expect(res.status).toBe(422)
  })
})

describe('GET /brands/:id', () => {
  it('deve retornar marca por ID com carros', async () => {
    const token = await getAdminToken()
    const created = await request(app)
      .post('/brands')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Marca Específica' })
    const res = await request(app).get(`/brands/${created.body.id}`)
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Marca Específica')
    expect(res.body).toHaveProperty('cars')
  })

  it('deve retornar 404 para ID inexistente', async () => {
    const res = await request(app).get('/brands/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})

describe('PUT /brands/:id', () => {
  it('deve atualizar autor como ADMIN', async () => {
    const token = await getAdminToken()
    const created = await request(app)
      .post('/brands')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nome Original' })
    const res = await request(app)
      .put(`/brands/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nome Atualizado' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Nome Atualizado')
  })
})

describe('DELETE /brands/:id', () => {
  it('deve deletar autor como ADMIN', async () => {
    const token = await getAdminToken()
    const created = await request(app)
      .post('/brands')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Marca Para Deletar' })
    const res = await request(app)
      .delete(`/brands/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(204)
  })
})
