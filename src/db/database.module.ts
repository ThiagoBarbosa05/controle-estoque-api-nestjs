import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { CustomerRepository } from './repositories/customer-repository'
import { UserRepository } from './repositories/user-repository'
import { WineRepository } from './repositories/wine-repository'

@Module({
	providers: [
		PrismaService,
		CustomerRepository,
		UserRepository,
		WineRepository,
	],
	exports: [PrismaService, CustomerRepository, UserRepository, WineRepository],
})
export class DatabaseModule {}
