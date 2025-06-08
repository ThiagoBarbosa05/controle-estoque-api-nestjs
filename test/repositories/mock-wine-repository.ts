export const mockWineRepository = () => ({
	createWine: vi.fn(),
	findById: vi.fn(),
	findWineDetails: vi.fn(),
	findMany: vi.fn(),
	updateWine: vi.fn(),
	wineMetrics: vi.fn(),
	deleteWine: vi.fn(),
})
