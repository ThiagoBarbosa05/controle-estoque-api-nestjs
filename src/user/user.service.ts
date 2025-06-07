import {
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { User } from './user.interface'
import { UserRepository } from '@/db/repositories/user-repository'
import { hash } from 'bcrypt'

export interface GetUserOutput {
	id: string
	name: string
	email: string
	roles: {
		id: string
		name: string
	}[]
	customer: {
		id: string
		name: string
		consigned: {
			id: string
		}[]
	}
}

export interface ListUsersOutput {
	id: string
	name: string
	email: string
	createdAt: Date
	roles: {
		id: string
		name: string
	}[]

	customer: {
		name: string
		id: string
	}
}

@Injectable()
export class UserService {
	constructor(private userRepository: UserRepository) {}

	async createUser(user: User): Promise<{ userId: string }> {
		const existingUser = await this.userRepository.findByEmail(user.email)

		if (existingUser) {
			throw new ConflictException(
				`Já existe um usuário com esse email: ${user.email}.`,
			)
		}

		const saltRounds = 6

		const passwordHashed = await hash(user.password, saltRounds)

		user.password = passwordHashed

		const userCreated = await this.userRepository.createUser(user)

		return { userId: userCreated.id }
	}

	async getUser(userId: string): Promise<GetUserOutput> {
		const user = await this.userRepository.findById(userId)

		if (!user) {
			throw new NotFoundException('Usuário não encontrado.')
		}

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			customer: {
				id: user.customer.id,
				name: user.customer.name,
				consigned: user.customer.Consigned,
			},
			roles: user.roles.map((role) => ({
				id: role.role.id,
				name: role.role.name,
			})),
		}
	}

	async listUsers(searchTerm?: string): Promise<ListUsersOutput[]> {
		const users = await this.userRepository.findMany(searchTerm)

		return users.map((user) => ({
			id: user.id,
			name: user.name,
			email: user.email,
			createdAt: user.createdAt,
			roles: user.roles.map((role) => ({
				id: role.role.id,
				name: role.role.name,
			})),
			customer: {
				id: user.customer.id,
				name: user.customer.name,
			},
		}))
	}

	async updateUser(user: User): Promise<{ updatedUserId: string }> {}
}
