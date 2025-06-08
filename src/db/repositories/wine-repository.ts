import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { Wine } from '@/wine/wine.interface'
import { Prisma } from 'prisma/generated'
import { WineMetrics } from '@/wine/wine-metric.interface'

@Injectable()
export class WineRepository {
	constructor(private prisma: PrismaService) {}

	async createWine(wine: Wine) {
		const newWine = await this.prisma.wine.create({
			data: {
				name: wine.name,
				price: wine.price,
				size: wine.size,
				country: wine.country,
				type: wine.type,
				harvest: wine.harvest,
				producer: wine.producer,
			},
		})

		return {
			wineId: newWine.id,
		}
	}

	async findById(wineId: string) {
		const wine = await this.prisma.wine.findUnique({
			where: {
				id: wineId,
			},
		})

		if (!wine) {
			return null
		}

		return wine
	}

	async findWineDetails(wineId: string) {
		const wine = await this.prisma.wine.findUnique({
			where: {
				id: wineId,
			},
			select: {
				id: true,
				name: true,
				harvest: true,
				createdAt: true,
				updatedAt: true,
				country: true,
				price: true,
				producer: true,
				size: true,
				type: true,
				WineOnConsigned: {
					select: {
						wineId: true,
						consignedId: true,
						balance: true,
						consigned: {
							select: {
								id: true,
								customer: {
									select: {
										id: true,
										name: true,
									},
								},
							},
						},
					},
					where: {
						consigned: {
							status: 'EM_ANDAMENTO',
							customer: {
								disabledAt: null,
							},
						},
					},
				},
			},
		})

		if (!wine) {
			return null
		}

		return wine
	}

	async findMany(searchTerm?: string) {
		const wines = await this.prisma.wine.findMany({
			where: {
				name: {
					contains: searchTerm as string,
					mode: 'insensitive',
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: 10,
		})

		return wines
	}

	async updateWine(wineId: string, wine: Wine) {
		const updatedWine = await this.prisma.wine.update({
			where: {
				id: wineId,
			},
			data: wine,
		})

		return { wineUpdated: updatedWine.id }
	}

	async wineMetrics({
		page,
		pageSize,
		searchTerm,
	}: { searchTerm?: string; page: number; pageSize: number }): Promise<
		WineMetrics[]
	> {
		const offset = (page - 1) * pageSize

		const query = Prisma.sql`
    SELECT 
      w.name AS wine_name,
      w.id AS wine_id,
      w.updated_at AS updated_at,
      c.name AS customer_name,
      CAST(COUNT(*)  OVER() AS INTEGER)  AS total,
      CAST(SUM(woc.balance) AS INTEGER) AS total_balance
    FROM wines w
    JOIN wine_on_consigned woc ON w.id = woc.wine_id
    JOIN consigned con ON woc.consigned_id = con.id
    JOIN customers c ON con.customer_id = c.id
  `

		const whereClause = searchTerm
			? Prisma.sql`  WHERE 
        (w.name ILIKE ${`%${searchTerm}%`} 
        OR c.name ILIKE ${`%${searchTerm}%`}) 
        AND con.status = 'EM_ANDAMENTO'
        AND c.disabled_at IS NULL`
			: Prisma.sql`
      WHERE 
        con.status = 'EM_ANDAMENTO'
        AND c.disabled_at IS NULL
    `

		const groupOrderPagination = Prisma.sql`
    GROUP BY w.id, c.name
    ORDER BY c.name, w.id
    LIMIT ${pageSize} OFFSET ${offset};
  `

		const fullQuery = Prisma.sql`${query} ${whereClause} ${groupOrderPagination}`

		const result = await this.prisma.$queryRaw<WineMetrics[]>(fullQuery)

		return result
	}

	async deleteWine(wineId: string) {
		await this.prisma.wine.delete({
			where: {
				id: wineId,
			},
		})
	}
}
