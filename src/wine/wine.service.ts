import { WineRepository } from '@/db/repositories/wine-repository'
import { Injectable, NotFoundException } from '@nestjs/common'
import { Wine } from './wine.interface'
import { WineDetails } from './wine-details.interface'
import { WineMetrics } from './wine-metric.interface'

@Injectable()
export class WineService {
	constructor(private wineRepository: WineRepository) {}

	async createWine(wine: Wine): Promise<{ wineId: string }> {
		const winePriceInCents = wine.price * 100

		wine.price = winePriceInCents

		const { wineId } = await this.wineRepository.createWine(wine)

		return {
			wineId,
		}
	}

	async getWine(wineId: string): Promise<Wine> {
		const wine = await this.wineRepository.findById(wineId)

		if (!wine) {
			throw new NotFoundException('Vinho não encontrado')
		}

		return {
			...wine,
			price: wine.price / 100,
		}
	}

	async getWineDetails(wineId: string): Promise<WineDetails> {
		const wineDetails = await this.wineRepository.findWineDetails(wineId)

		if (!wineDetails) {
			throw new NotFoundException('Vinho não encontrado')
		}

		return {
			...wineDetails,
			price: wineDetails.price / 100,
			wineOnConsigned: wineDetails.WineOnConsigned,
		}
	}

	async listWines(searchTerm?: string): Promise<{ wines: Wine[] }> {
		const wines = await this.wineRepository.findMany(searchTerm)

		return {
			wines: wines.map((wine) => ({
				...wine,
				price: wine.price / 100,
			})),
		}
	}

	async updateWine(wineId: string, wine: Wine): Promise<{ wineId: string }> {
		const wineToUpdate = await this.wineRepository.findById(wineId)

		if (!wineToUpdate) {
			throw new NotFoundException('Vinho não encontrado')
		}

		const winePriceInCents = wine.price * 100

		wine.price = winePriceInCents

		const { wineUpdated } = await this.wineRepository.updateWine(wineId, wine)

		return {
			wineId: wineUpdated,
		}
	}

	async listWineMetrics({
		page,
		pageSize,
		searchTerm,
	}: { searchTerm?: string; page: number; pageSize: number }): Promise<{
		items: WineMetrics[]
	}> {
		const wineMetrics = await this.wineRepository.wineMetrics({
			page,
			pageSize,
			searchTerm,
		})

		return { items: wineMetrics }
	}
}
