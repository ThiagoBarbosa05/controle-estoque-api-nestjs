export interface WineDetails {
	id?: string
	name: string
	harvest?: number
	type: string
	price: number
	producer: string
	country: string
	size: string
	createdAt: Date
	updatedAt: Date
	wineOnConsigned: {
		wineId: string
		consignedId: string
		balance: number
		consigned: {
			id: string
			customer: {
				id: string
				name: string
			}
		}
	}[]
}
