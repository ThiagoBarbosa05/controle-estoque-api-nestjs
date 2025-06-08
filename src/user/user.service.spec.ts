import { mockUserRepository } from 'test/repositories/mock-user-repository'
import { GetUserOutput, ListUsersOutput, UserService } from './user.service'
import { Test, TestingModule } from '@nestjs/testing'
import { UserRepository } from '@/db/repositories/user-repository'
import { User } from './user.interface'
import { randomUUID } from 'node:crypto'
import { faker } from '@faker-js/faker'
import { ConflictException, NotFoundException } from '@nestjs/common'

describe('UserService', () => {
	let service: UserService
	let repository: ReturnType<typeof mockUserRepository>

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserService,
				{
					provide: UserRepository,
					useFactory: mockUserRepository,
				},
			],
		}).compile()

		service = module.get<UserService>(UserService)
		repository = module.get(UserRepository)
	})

	// Create a new user
	it('should create a new user', async () => {
		const user: User = {
			id: randomUUID(),
			email: faker.internet.email(),
			password: faker.internet.password(),
			name: faker.person.fullName(),
		}

		repository.findByEmail.mockResolvedValue(null)
		repository.createUser.mockResolvedValue(user)

		const result = await service.createUser(user)

		expect(result.userId).toEqual(user.id)
		expect(repository.findByEmail).toHaveBeenCalledWith(user.email)
		expect(repository.createUser).toHaveBeenCalledWith(user)
	})

	it('should throw an exception if user already exists', async () => {
		const user: User = {
			id: randomUUID(),
			email: faker.internet.email(),
			password: faker.internet.password(),
			name: faker.person.fullName(),
		}

		repository.findByEmail.mockResolvedValue(user)

		await expect(service.createUser(user)).rejects.toThrow(ConflictException)

		expect(repository.findByEmail).toHaveBeenCalled()
		expect(repository.createUser).not.toHaveBeenCalled()
	})

	// get user
	it('should get a user by id', async () => {
		const userId = randomUUID()

		const user: GetUserOutput = {
			id: userId,
			email: faker.internet.email(),
			name: faker.person.fullName(),
			customer: {
				id: randomUUID(),
				name: faker.company.name(),
				consigned: [{ id: randomUUID() }],
			},
			roles: [],
		}

		repository.findById.mockResolvedValue(user)

		const result = await service.getUser(userId)

		expect(result).toBeDefined()
		expect(result.id).toEqual(userId)
		expect(repository.findById).toHaveBeenCalledWith(userId)
	})

	it('should throw an exception if user does not exist', async () => {
		const userId = randomUUID()

		repository.findById.mockResolvedValue(null)

		await expect(service.getUser(userId)).rejects.toThrow(NotFoundException)

		expect(repository.findById).toHaveBeenCalledWith(userId)
	})

	// list users
	it('should list users', async () => {
		const users: ListUsersOutput[] = [
			{
				id: randomUUID(),
				name: faker.person.fullName(),
				email: faker.internet.email(),
				createdAt: new Date(),
				roles: [],
				customer: {
					id: randomUUID(),
					name: faker.company.name(),
				},
			},
			{
				id: randomUUID(),
				name: faker.person.fullName(),
				email: faker.internet.email(),
				createdAt: new Date(),
				roles: [],
				customer: {
					id: randomUUID(),
					name: faker.company.name(),
				},
			},
		]

		repository.findMany.mockResolvedValue(users)

		const result = await service.listUsers()

		expect(result).toBeDefined()
		expect(result.length).toEqual(users.length)
	})

	it('should list users with search term', async () => {
		const searchTerm = 'John Doe'

		const users: ListUsersOutput[] = [
			{
				id: randomUUID(),
				name: 'John Doe',
				email: faker.internet.email(),
				createdAt: new Date(),
				roles: [],
				customer: {
					id: randomUUID(),
					name: 'Acme Inc',
				},
			},
			{
				id: randomUUID(),
				name: faker.person.fullName(),
				email: faker.internet.email(),
				createdAt: new Date(),
				roles: [],
				customer: {
					id: randomUUID(),
					name: 'Acme Inc',
				},
			},
		]

		repository.findMany.mockResolvedValue([users[0]])
		const result = await service.listUsers(searchTerm)

		expect(result).toBeDefined()
		expect(result.length).toEqual(1)
		expect(repository.findMany).toHaveBeenCalledWith(searchTerm)
	})

	// update user
	it('should update user', async () => {
		const userId = faker.string.uuid()

		const user = {
			id: faker.string.uuid(),
			name: faker.person.fullName(),
			email: faker.internet.email(),
			password: faker.internet.password(),
		}

		repository.existingUser.mockResolvedValue(null)
		repository.findById.mockResolvedValue({ ...user })
		repository.updateUser.mockResolvedValue({ userUpdated: user.id })

		const result = await service.updateUser(user, userId)

		expect(result).toEqual({ updatedUserId: user.id })

		expect(repository.existingUser).toHaveBeenCalledWith({
			userId,
			email: user.email,
		})

		expect(repository.findById).toHaveBeenCalledWith(user.id)

		expect(repository.updateUser).toHaveBeenCalledWith(
			expect.objectContaining({
				...user,
				password: expect.any(String),
			}),
			userId,
		)
	})

	it('should throw ConflictException if user with same email exists', async () => {
		const userId = faker.string.uuid()

		const user = {
			id: faker.string.uuid(),
			name: faker.person.fullName(),
			email: faker.internet.email(),
			password: faker.internet.password(),
		}

		repository.existingUser.mockResolvedValue({ ...user })

		await expect(service.updateUser(user, userId)).rejects.toThrow(
			ConflictException,
		)

		expect(repository.existingUser).toHaveBeenCalledWith({
			userId,
			email: user.email,
		})
	})

	it('should throw NotFoundException if user does not exist', async () => {
		const userId = faker.string.uuid()

		const user = {
			id: faker.string.uuid(),
			name: faker.person.fullName(),
			email: faker.internet.email(),
			password: faker.internet.password(),
		}

		repository.existingUser.mockResolvedValue(null)
		repository.findById.mockResolvedValue(null)

		await expect(service.updateUser(user, userId)).rejects.toThrow(
			NotFoundException,
		)
	})

	// delete user

	it('should throw NotFoundException if user does not exist', async () => {
		const userId = faker.string.uuid()

		repository.findById.mockResolvedValue(null)

		await expect(service.deleteUser(userId)).rejects.toThrow(NotFoundException)
		expect(repository.findById).toHaveBeenCalledWith(userId)
		expect(repository.deleteUser).not.toHaveBeenCalled()
	})

	it('should delete user if found', async () => {
		const userId = faker.string.uuid()

		repository.findById.mockResolvedValue({ id: userId })
		repository.deleteUser.mockResolvedValue(undefined)

		await expect(service.deleteUser(userId)).resolves.toBeUndefined()
		expect(repository.findById).toHaveBeenCalledWith(userId)
		expect(repository.deleteUser).toHaveBeenCalledWith(userId)
	})
})
