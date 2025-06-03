import type { Address } from './address.interface'

export interface Customer {
	id: string
	name: string
	document: string
	contactPerson?: string
	email?: string
	cellphone?: string
	businessPhone?: string
	stateRegistration: string
	createdAt: Date
	updatedAt?: Date
	disabledAt?: Date
	address?: Address
}
