export interface User {
	id?: string
	email: string
	name: string
	password: string
	associatedCustomerId?: string
	createdAt?: Date
	updatedAt?: Date
}
