import { Test, TestingModule } from '@nestjs/testing'
import { CustomerService } from './customer.service'
import { mockCustomerRepository } from 'test/repositories/mock-customer-repository'
import { CustomerRepository } from '@/db/repositories/customer-repository'
import { Customer } from './customer.interface'
import { faker } from '@faker-js/faker'
import { ConflictException, NotFoundException } from '@nestjs/common'

describe('CustomerService', () => {
	let service: CustomerService
	let repository: ReturnType<typeof mockCustomerRepository>

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CustomerService,
				{
					provide: CustomerRepository,
					useFactory: mockCustomerRepository,
				},
			],
		}).compile()

		service = module.get<CustomerService>(CustomerService)
		repository = module.get(CustomerRepository)
	})

	// Create a new customer
	it('should create a new customer', async () => {
		const customer: Customer = {
			id: faker.string.uuid(),
			name: faker.company.name(),
			document: faker.string.numeric(14),
			email: faker.internet.email(),
			stateRegistration: faker.string.numeric(9),
		}

		repository.existingCustomer.mockResolvedValue(null)
		repository.create.mockResolvedValue(customer)

		const result = await service.createCustomer(customer)

		expect(result).toEqual({ customerId: customer.id })
		expect(repository.existingCustomer).toHaveBeenCalledWith({
			document: customer.document,
			email: customer.email,
			stateRegistration: customer.stateRegistration,
		})
		expect(repository.create).toHaveBeenCalledWith(customer)
	})

	it('should throw ConflictException if customer already exists', async () => {
		const customer: Customer = {
			id: faker.string.uuid(),
			name: faker.company.name(),
			document: faker.string.numeric(14),
			email: faker.internet.email(),
			stateRegistration: faker.string.numeric(9),
		}

		repository.existingCustomer.mockResolvedValue(customer)

		await expect(service.createCustomer(customer)).rejects.toThrow(
			ConflictException,
		)

		expect(repository.existingCustomer).toHaveBeenCalled()
		expect(repository.create).not.toHaveBeenCalled()
	})

	// Get customer details
	it('should get customer details', async () => {
		const customer: Customer = {
			id: faker.string.uuid(),
			name: faker.company.name(),
			document: faker.string.numeric(14),
			email: faker.internet.email(),
			stateRegistration: faker.string.numeric(9),
		}

		repository.findById.mockResolvedValue(customer)

		const result = await service.getCustomerDetails(customer.id)

		expect(result).toEqual(customer)
		expect(repository.findById).toHaveBeenCalledWith(customer.id)
	})

	it('should throw NotFoundException if customer does not exist', async () => {
		const customer: Customer = {
			id: faker.string.uuid(),
			name: faker.company.name(),
			document: faker.string.numeric(14),
			email: faker.internet.email(),
			stateRegistration: faker.string.numeric(9),
		}

		repository.findById.mockResolvedValue(null)

		await expect(service.getCustomerDetails(customer.id)).rejects.toThrow(
			NotFoundException,
		)

		expect(repository.findById).toHaveBeenCalledWith(customer.id)
	})

	// List customers
	it('should list customers', async () => {
		const customers: Customer[] = [
			{
				id: faker.string.uuid(),
				name: faker.company.name(),
				document: faker.string.numeric(14),
				email: faker.internet.email(),
				stateRegistration: faker.string.numeric(9),
			},
			{
				id: faker.string.uuid(),
				name: faker.company.name(),
				document: faker.string.numeric(14),
				email: faker.internet.email(),
				stateRegistration: faker.string.numeric(9),
			},
		]

		repository.listCustomers.mockResolvedValue(customers)

		const result = await service.listCustomers()
		expect(result).toHaveLength(2)
		expect(result[0]).toHaveProperty('id')
		expect(result[0]).toHaveProperty('name')
	})

	it('should return an empty array if no customers exist', async () => {
		repository.listCustomers.mockResolvedValue([])

		const result = await service.listCustomers()
		expect(result).toEqual([])
		expect(repository.listCustomers).toHaveBeenCalledWith(undefined)
	})

	it('should filter customers by search term', async () => {
		const customers: Customer[] = [
			{
				id: faker.string.uuid(),
				name: 'Empresa Teste',
				document: faker.string.numeric(14),
				email: faker.internet.email(),
				stateRegistration: faker.string.numeric(9),
			},
			{
				id: faker.string.uuid(),
				name: faker.company.name(),
				document: faker.string.numeric(14),
				email: faker.internet.email(),
				stateRegistration: faker.string.numeric(9),
			},
		]

		repository.listCustomers.mockResolvedValue([customers[0]])
		const searchTerm = 'Empresa Teste'
		const result = await service.listCustomers(searchTerm)

		expect(result).toHaveLength(1)
		expect(result[0].name).toEqual(searchTerm)
		expect(repository.listCustomers).toHaveBeenCalledWith(searchTerm)
	})

	// List customers summary
	it('should return customer summary with total balance and total wine types', async () => {
		const mockData = [
			{
				id: 'customer-id-1',
				name: 'Customer One',
				Consigned: [
					{
						id: 'consigned-id-1',
						winesOnConsigned: [
							{
								balance: 10,
								wines: { type: 'Tinto' },
							},
							{
								balance: 20,
								wines: { type: 'Branco' },
							},
							{
								balance: 5,
								wines: { type: 'Tinto' },
							},
						],
					},
				],
			},
		]

		repository.listCustomersSummary.mockResolvedValue(mockData)

		const result = await service.listCustomersSummary()

		expect(result).toEqual([
			{
				customerId: 'customer-id-1',
				customer: 'Customer One',
				consignedId: 'consigned-id-1',
				totalTypes: 2, // Tinto, Branco
				totalBalance: 35, // 10 + 20 + 5
			},
		])
	})

	// Update customer
	it('should update and return updatedCustomerId if no conflict and found', async () => {
		const customer: Customer = {
			id: faker.string.uuid(),
			name: faker.company.name(),
			document: faker.string.numeric(14),
			email: faker.internet.email(),
			stateRegistration: faker.string.numeric(9),
		}

		repository.existingCustomer.mockResolvedValue(null)
		repository.findById.mockResolvedValue({ ...customer })
		repository.update.mockResolvedValue({ ...customer })

		const result = await service.updateCustomer(customer, customer.id)

		expect(result).toEqual({ updatedCustomerId: customer.id })

		expect(repository.existingCustomer).toHaveBeenCalledWith(
			{
				document: customer.document,
				email: customer.email,
				stateRegistration: customer.stateRegistration,
			},
			customer.id,
		)
		expect(repository.findById).toHaveBeenCalledWith(customer.id)
		expect(repository.update).toHaveBeenCalledWith(customer)
	})

	it('should throw NotFoundException if customer to update does not exist', async () => {
		const customer: Customer = {
			id: faker.string.uuid(),
			name: faker.company.name(),
			document: faker.string.numeric(14),
			email: faker.internet.email(),
			stateRegistration: faker.string.numeric(9),
		}

		repository.existingCustomer.mockResolvedValue(null)
		repository.findById.mockResolvedValue(null)

		await expect(service.updateCustomer(customer, customer.id)).rejects.toThrow(
			NotFoundException,
		)

		expect(repository.findById).toHaveBeenCalledWith(customer.id)
	})

	it('should throw ConflictException if another customer exists with the same data', async () => {
		const customer: Customer = {
			id: faker.string.uuid(),
			name: faker.company.name(),
			document: faker.string.numeric(14),
			email: faker.internet.email(),
			stateRegistration: faker.string.numeric(9),
		}

		repository.existingCustomer.mockResolvedValue({
			...customer,
			id: faker.string.uuid(), // diferente ID simula outro cliente
		})

		await expect(service.updateCustomer(customer, customer.id)).rejects.toThrow(
			ConflictException,
		)

		expect(repository.existingCustomer).toHaveBeenCalledWith(
			{
				document: customer.document,
				email: customer.email,
				stateRegistration: customer.stateRegistration,
			},
			customer.id,
		)
	})

	// Disable customer
	it('should disable customer', async () => {
		const customer: Customer = {
			id: faker.string.uuid(),
			name: faker.company.name(),
			document: faker.string.numeric(14),
			email: faker.internet.email(),
			stateRegistration: faker.string.numeric(9),
		}

		repository.findById.mockResolvedValue({
			id: customer.id,
			name: faker.company.name(),
			email: faker.internet.email(),
			document: faker.string.numeric(14),
			stateRegistration: faker.string.numeric(9),
		})

		repository.disableCustomer.mockResolvedValue(undefined)

		await expect(service.deleteCustomer(customer.id)).resolves.toBeUndefined()

		expect(repository.findById).toHaveBeenCalledWith(customer.id)
		expect(repository.disableCustomer).toHaveBeenCalledWith(customer.id)
	})

	it('should throw NotFoundException if customer to disable does not exist', async () => {
		repository.findById.mockResolvedValue(null)
		const customerId = faker.string.uuid()

		await expect(service.deleteCustomer(customerId)).rejects.toThrow(
			NotFoundException,
		)

		expect(repository.findById).toHaveBeenCalledWith(customerId)
		expect(repository.disableCustomer).not.toHaveBeenCalled()
	})
})
