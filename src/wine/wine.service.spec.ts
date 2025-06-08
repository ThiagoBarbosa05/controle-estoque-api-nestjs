import { Test, TestingModule } from '@nestjs/testing'
import { WineService } from './wine.service'
import { Wine } from './wine.interface'
import { faker } from '@faker-js/faker'
import { mockWineRepository } from 'test/repositories/mock-wine-repository'
import { WineRepository } from '@/db/repositories/wine-repository'
import { NotFoundException } from '@nestjs/common'
import { WineMetrics } from './wine-metric.interface'

describe('WineService', () => {
	let service: WineService
	let repository: ReturnType<typeof mockWineRepository>

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				WineService,
				{
					provide: WineRepository,
					useFactory: mockWineRepository,
				},
			],
		}).compile()

		service = module.get<WineService>(WineService)
		repository = module.get(WineRepository)
	})

	// create wine
	it('should create wine with price in cents and return wineId', async () => {
		const wine: Wine = {
			id: faker.string.uuid(),
			name: faker.commerce.productName(),
			type: 'Tinto',
			country: faker.location.country(),
			producer: 'Producer A',
			size: '750ml',
			price: 59.9, // R$59,90
		}

		const expectedWine = { ...wine, price: 5990 }

		repository.createWine.mockResolvedValue({ wineId: wine.id })

		const result = await service.createWine(wine)

		expect(repository.createWine).toHaveBeenCalledWith(expectedWine)

		expect(result).toEqual({ wineId: wine.id })
	})

	// get wine
	it('should get wine by id', async () => {
		const wineId = faker.string.uuid()
		const wine: Wine = {
			id: wineId,
			name: faker.commerce.productName(),
			type: 'Tinto',
			country: faker.location.country(),
			producer: 'Producer A',
			size: '750ml',
			price: 5990, // R$59,90
		}

		repository.findById.mockResolvedValue(wine)

		const result = await service.getWine(wineId)

		expect(repository.findById).toHaveBeenCalledWith(wineId)

		expect(result).toEqual({ ...wine, price: wine.price / 100 })
	})

	it('should throw NotFoundException when wine is not found', async () => {
		const wineId = faker.string.uuid()

		repository.findById.mockResolvedValue(null)

		await expect(service.getWine(wineId)).rejects.toThrow(NotFoundException)
	})

	// get wine details
	it('should return wine details with price converted to reais', async () => {
		const wineId = faker.string.uuid()
		const mockWineDetails = {
			id: wineId,
			name: faker.commerce.productName(),
			harvest: 2021,
			type: 'Tinto',
			price: 4990, // centavos
			producer: faker.company.name(),
			country: 'Brasil',
			size: '750ml',
			createdAt: new Date(),
			updatedAt: new Date(),
			WineOnConsigned: [
				{
					wineId,
					consignedId: faker.string.uuid(),
					balance: 5,
					consigned: {
						id: faker.string.uuid(),
						customer: {
							id: faker.string.uuid(),
							name: faker.person.fullName(),
						},
					},
				},
			],
		}

		repository.findWineDetails.mockResolvedValue(mockWineDetails)

		const result = await service.getWineDetails(wineId)

		expect(repository.findWineDetails).toHaveBeenCalledWith(wineId)
		expect(result.price).toBe(49.9)
		expect(result.wineOnConsigned).toEqual(mockWineDetails.WineOnConsigned)
	})

	it('should throw NotFoundException if wine is not found', async () => {
		const wineId = faker.string.uuid()

		repository.findWineDetails.mockResolvedValue(null)

		await expect(() => service.getWineDetails(wineId)).rejects.toThrow(
			NotFoundException,
		)

		expect(repository.findWineDetails).toHaveBeenCalledWith(wineId)
	})

	// list wines

	it('should return a list of wines without searchTerm', async () => {
		const mockWines = [
			{ id: faker.string.uuid(), name: 'Vinho A', price: 3000 },
			{ id: faker.string.uuid(), name: 'Vinho B', price: 4500 },
		]

		repository.findMany.mockResolvedValue(mockWines)

		const result = await service.listWines()

		expect(repository.findMany).toHaveBeenCalledWith(undefined)
		expect(result.wines).toEqual(
			mockWines.map((wine) => ({
				...wine,
				price: wine.price / 100,
			})),
		)
	})

	it('should return a filtered list of wines with searchTerm', async () => {
		const searchTerm = 'Tinto'
		const mockFilteredWines = [
			{ id: faker.string.uuid(), name: 'Tinto Seco', price: 5000 },
		]

		repository.findMany.mockResolvedValue(mockFilteredWines)

		const result = await service.listWines(searchTerm)

		expect(repository.findMany).toHaveBeenCalledWith(searchTerm)
		expect(result.wines).toEqual(
			mockFilteredWines.map((wine) => ({
				...wine,
				price: wine.price / 100,
			})),
		)
	})

	// update wine
	it('should update wine and return wineId', async () => {
		const wineId = faker.string.uuid()
		const wine = {
			id: wineId,
			name: 'Vinho Branco',
			price: 59.9,
			type: 'Branco',
			producer: 'Produtor X',
			country: 'Brasil',
			size: '750ml',
			createdAt: new Date(),
			updatedAt: new Date(),
		}

		repository.findById.mockResolvedValue({ ...wine })
		repository.updateWine.mockResolvedValue({ wineUpdated: wineId })

		const result = await service.updateWine(wineId, { ...wine })

		expect(repository.findById).toHaveBeenCalledWith(wineId)
		expect(repository.updateWine).toHaveBeenCalledWith(wineId, {
			...wine,
			price: wine.price * 100,
		})
		expect(result).toEqual({ wineId })
	})

	it('should throw NotFoundException if wine is not found', async () => {
		const wineId = faker.string.uuid()
		const wine = {
			id: wineId,
			name: 'Tinto',
			price: 75.0,
			type: 'Tinto',
			producer: 'Produtor Y',
			country: 'Chile',
			size: '750ml',
			createdAt: new Date(),
			updatedAt: new Date(),
		}

		repository.findById.mockResolvedValue(null)

		await expect(service.updateWine(wineId, wine)).rejects.toThrowError(
			new NotFoundException('Vinho não encontrado'),
		)

		expect(repository.findById).toHaveBeenCalledWith(wineId)
		expect(repository.updateWine).not.toHaveBeenCalled()
	})

	// list wine metrics
	it('should return a list of wine metrics', async () => {
		const mockWineMetrics: WineMetrics[] = [
			{
				customer_name: faker.person.fullName(),
				total: '30',
				total_balance: 100,
				wine_id: faker.string.uuid(),
				wine_name: faker.commerce.productName(),
				updated_at: new Date().toISOString(),
			},
		]

		repository.wineMetrics.mockResolvedValue(mockWineMetrics)

		const result = await service.listWineMetrics({
			searchTerm: undefined,
			page: 1,
			pageSize: 10,
		})

		expect(repository.wineMetrics).toHaveBeenCalledWith({
			searchTerm: undefined,
			page: 1,
			pageSize: 10,
		})
		expect(result.items).toEqual(mockWineMetrics)
	})

	// delete wine
	it('should delete wine', async () => {
		const wineId = faker.string.uuid()

		repository.findById.mockResolvedValue({ id: wineId })
		repository.deleteWine.mockResolvedValue(undefined)

		await service.deleteWine(wineId)

		expect(repository.deleteWine).toHaveBeenCalledWith(wineId)
	})
})
