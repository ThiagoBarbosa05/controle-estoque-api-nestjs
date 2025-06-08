export interface Wine {
	id?: string
	name: string
	harvest?: number
	type: string
	price: number
	producer: string
	country: string
	size: string
	createdAt?: Date
	updatedAt?: Date
}
