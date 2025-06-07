export const mockUserRepository = () => ({
	createUser: vi.fn(),
	findByEmail: vi.fn(),
	findById: vi.fn(),
	findMany: vi.fn(),
})
