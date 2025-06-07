import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { User } from '@/user/user.interface'
import { User as PrismaUser } from 'prisma/generated'

@Injectable()
export class UserRepository {
	constructor(private prisma: PrismaService) {}

	async createUser(user: User): Promise<PrismaUser> {
		const newUser = await this.prisma.user.create({
			data: {
				email: user.email,
				name: user.name,
				password: user.password,
				associatedCustomerId: user.associatedCustomerId,
			},
		})

		return newUser
	}

	async findByEmail(email: string): Promise<PrismaUser | null> {
		const user = await this.prisma.user.findUnique({
			where: { email },
		})

		if (!user) {
			return null
		}

		return user
	}

	async findById(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: {
				id: userId,
			},
			select: {
				name: true,
				email: true,
				associatedCustomerId: true,
				createdAt: true,
				password: true,
				id: true,
				roles: {
					select: {
						role: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
				customer: {
					select: {
						id: true,
						name: true,
						Consigned: {
							select: {
								id: true,
							},
						},
					},
				},
			},
		})

		if (!user) {
			return null
		}

		return user
	}

	async findMany(searchTerm?: string) {
		const users = await this.prisma.user.findMany({
			select: {
				id: true,
				name: true,
				email: true,
				createdAt: true,
				roles: {
					select: {
						role: {
							select: {
								name: true,
								id: true,
							},
						},
					},
				},
				customer: {
					select: {
						name: true,
						id: true,
					},
				},
			},
			where: {
				name: {
					contains: searchTerm as string,
					mode: 'insensitive',
				},
				OR: [
					{
						customer: null, // Inclui usuários sem nenhum customer
					},
					{
						customer: {
							is: {
								disabledAt: null, // Inclui usuários com customer ativo
							},
						},
					},
				],
			},
			orderBy: {
				createdAt: 'desc',
			},
		})

		return users
	}

	async existingUser({ userId, email }: { userId: string; email: string }) {
		const user = await this.prisma.user.findFirst({
			where: {
				AND: [{ id: { not: userId } }, { email: email }],
			},
		})

		if (!user) {
			return null
		}

		return user
	}

	async updateUser(user: User, userId: string) {}
}
