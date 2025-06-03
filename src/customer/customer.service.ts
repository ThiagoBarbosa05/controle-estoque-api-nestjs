import {
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import type { Customer } from './customer.interface'
import { CustomerRepository } from '@/db/repositories/customer-repository'

export interface ListCustomersOutput {
	id: string
	name: string
	contactPerson: string
	email: string
	cellphone: string
	businessPhone: string
}

export interface ListCustomersSummaryOutput {
	customerId: string
	customer: string
	consignedId: string
	totalTypes: number
	totalBalance: number
}

@Injectable()
export class CustomerService {
	constructor(private customerRepository: CustomerRepository) {}

	async createCustomer(customer: Customer): Promise<{ customerId: string }> {
		const existingCustomer = await this.customerRepository.existingCustomer({
			document: customer.document,
			email: customer.email,
			stateRegistration: customer.stateRegistration,
		})

		if (existingCustomer) {
			throw new ConflictException(`
        Dados já cadastrados para outro cliente: ${existingCustomer.email === customer.email ? `email: ${existingCustomer.email}` : ''} =>
        ${existingCustomer.document === customer.document ? `CNPJ: ${existingCustomer.document}` : ''} =>
        ${existingCustomer.stateRegistration === customer.stateRegistration ? `ie: ${existingCustomer.stateRegistration}` : ''}
        `)
		}

		const newCustomer = await this.customerRepository.create(customer)

		return { customerId: newCustomer.id }
	}

	async getCustomerDetails(customerId: string): Promise<Customer> {
		const customer = await this.customerRepository.findById(customerId)

		if (!customer) {
			throw new NotFoundException(
				`Cliente não encontrado com o ID: ${customerId}`,
			)
		}

		return customer
	}

	async listCustomers(searchTerm?: string): Promise<ListCustomersOutput[]> {
		const customersList =
			await this.customerRepository.listCustomers(searchTerm)

		return customersList.map((customer) => ({
			businessPhone: customer.businessPhone,
			cellphone: customer.cellphone,
			contactPerson: customer.contactPerson,
			email: customer.email,
			id: customer.id,
			name: customer.name,
		}))
	}

	async listCustomersSummary(): Promise<ListCustomersSummaryOutput[]> {
		const customersList = await this.customerRepository.listCustomersSummary()

		const summary = customersList.map((customer) => {
			const allWines = customer.Consigned.flatMap((c) => c.winesOnConsigned)
			const totalBalance = allWines.reduce((sum, item) => sum + item.balance, 0)

			const wineTypes = new Set(allWines.map((item) => item.wines.type))
			const totalTypes = wineTypes.size

			return {
				customerId: customer.id,
				customer: customer.name,
				consignedId: customer.Consigned[0].id,
				totalTypes,
				totalBalance,
			}
		})

		return summary
	}

	async updateCustomer(
		customer: Customer,
		customerId: string,
	): Promise<{ updatedCustomerId: string }> {
		const existingCustomer = await this.customerRepository.existingCustomer(
			{
				document: customer.document,
				email: customer.email,
				stateRegistration: customer.stateRegistration,
			},
			customerId,
		)

		if (existingCustomer) {
			throw new ConflictException(`Já existe um cliente com os dados informados
        ${existingCustomer.email === customer.email ? `email: ${existingCustomer.email}` : ''} ->
				${existingCustomer.document === customer.document ? `CNPJ: ${existingCustomer.document}` : ''} ->
        ${existingCustomer.stateRegistration === customer.stateRegistration ? `ie: " ${existingCustomer.stateRegistration}` : ''}
        `)
		}

		const customerToUpdate = await this.customerRepository.findById(customerId)

		if (!customerToUpdate) {
			throw new NotFoundException(
				`Cliente não encontrado com o ID: ${customerId}`,
			)
		}

		const updateCustomer = await this.customerRepository.update(customer)

		return { updatedCustomerId: updateCustomer.id }
	}

	async deleteCustomer(customerId: string): Promise<void> {
		const customer = await this.customerRepository.findById(customerId)

		if (!customer) {
			throw new NotFoundException(
				`Cliente não encontrado com o ID: ${customerId}`,
			)
		}

		await this.customerRepository.disableCustomer(customerId)
	}
}
