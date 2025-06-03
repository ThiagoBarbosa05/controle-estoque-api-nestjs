export const mockCustomerRepository = () => ({
	existingCustomer: vi.fn(),
	create: vi.fn(),
	findById: vi.fn(),
	listCustomers: vi.fn(),
	listCustomersSummary: vi.fn(),
	update: vi.fn(),
	disableCustomer: vi.fn(),
})
