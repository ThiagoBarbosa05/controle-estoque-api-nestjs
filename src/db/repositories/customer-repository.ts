import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { Customer } from '@/customer/customer.interface'
import { Customer as PrismaCustomer } from 'prisma/generated'

@Injectable()
export class CustomerRepository {
	constructor(private prisma: PrismaService) {}

	async create(customer: Customer) {
		const newCustomer = await this.prisma.customer.create({
			data: {
				name: customer.name,
				email: customer.email,
				document: customer.document,
				cellphone: customer.cellphone,
				businessPhone: customer.businessPhone,
				contactPerson: customer.contactPerson,
				stateRegistration: customer.stateRegistration,
			},
		})

		if (customer.address) {
			const allFieldsEmpty = Object.values(customer.address || {}).every(
				(value) => value.trim() === '',
			)

			if (!allFieldsEmpty) {
				await this.prisma.address.create({
					data: {
						customerId: newCustomer.id,
						city: customer.address.city,
						state: customer.address.state,
						streetAddress: customer.address.streetAddress,
						number: customer.address.number,
						zipCode: customer.address.zipCode,
						neighborhood: customer.address.neighborhood,
					},
				})
			}
		}

		return newCustomer
	}

	async existingCustomer(
		{
			document,
			email,
			stateRegistration,
		}: { email?: string; document?: string; stateRegistration?: string },
		customerId?: string,
	) {
		let customer: PrismaCustomer | null = null

		if (customerId) {
			customer = await this.prisma.customer.findFirst({
				where: {
					AND: [
						{ id: { not: customerId } },
						{
							OR: [
								{ document: document },
								{ email: email },
								{ stateRegistration: stateRegistration },
							],
						},
					],
				},
			})
		} else {
			customer = await this.prisma.customer.findFirst({
				where: {
					OR: [{ document }, { email }, { stateRegistration }],
				},
			})
		}

		if (!customer) {
			return null
		}

		return customer
	}

	async findById(customerId: string) {
		const customer = await this.prisma.customer.findFirst({
			where: {
				AND: [{ id: customerId }, { disabledAt: null }],
			},
			include: {
				address: true,
			},
		})

		if (!customer) {
			return null
		}

		return customer
	}

	async listCustomers(searchTerm?: string) {
		const customers = await this.prisma.customer.findMany({
			select: {
				id: true,
				name: true,
				contactPerson: true,
				email: true,
				cellphone: true,
				businessPhone: true,
			},
			where: {
				AND: [
					{ disabledAt: null },
					{
						name: {
							contains: searchTerm as string,
							mode: 'insensitive',
						},
					},
				],
			},
			orderBy: {
				createdAt: 'desc',
			},
		})

		return customers
	}

	async listCustomersSummary() {
		const customers = await this.prisma.customer.findMany({
			where: {
				Consigned: {
					some: {
						id: {
							not: undefined,
						},
					},
				},
				disabledAt: null,
			},
			select: {
				id: true,
				name: true,
				Consigned: {
					where: {
						status: 'EM_ANDAMENTO',
					},
					select: {
						id: true,
						winesOnConsigned: {
							select: {
								balance: true,
								wines: {
									select: {
										type: true,
									},
								},
							},
						},
					},
				},
			},
		})

		return customers
	}

	async update(customer: Customer) {
		return this.prisma.customer.update({
			where: {
				id: customer.id,
			},
			data: {
				name: customer.name,
				document: customer.document,
				businessPhone: customer.businessPhone,
				cellphone: customer.cellphone,
				contactPerson: customer.contactPerson,
				stateRegistration: customer.stateRegistration,
				email: customer.email,
				address: customer.address
					? {
							update: {
								city: customer.address.city,
								state: customer.address.state,
								streetAddress: customer.address.streetAddress,
								number: customer.address.number,
								zipCode: customer.address.zipCode,
								neighborhood: customer.address.neighborhood,
							},
						}
					: undefined,
			},
		})
	}

	async disableCustomer(customerId: string) {
		await this.prisma.customer.update({
			where: {
				id: customerId,
			},
			data: {
				disabledAt: new Date(),
			},
		})
	}
}
