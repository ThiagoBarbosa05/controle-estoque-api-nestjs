import { Injectable } from '@nestjs/common'
import type { Customer } from './customer.interface'

@Injectable()
export class CustomerService {
	// constructor() {}

	async createCustomer(customer: Customer): Promise<{ customerId: string }> {
		return { customerId: '12345' }
	}
}
