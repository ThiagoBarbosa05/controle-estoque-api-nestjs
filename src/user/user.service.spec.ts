import { mockUserRepository } from 'test/repositories/mock-user-repository'
import { UserService } from './user.service'
import { Test, TestingModule } from '@nestjs/testing'
import { UserRepository } from '@/db/repositories/user-repository'
import { User } from './user.interface'
import { randomUUID } from 'node:crypto'
import { faker } from '@faker-js/faker'
import { ConflictException } from '@nestjs/common'

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
  it("should create a new user", async () => {
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

  it("should throw an exception if user already exists", async () => {
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

})
