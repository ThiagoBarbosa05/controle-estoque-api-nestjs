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
}
