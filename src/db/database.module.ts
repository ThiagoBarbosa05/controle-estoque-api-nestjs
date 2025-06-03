import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { CustomerRepository } from './repositories/customer-repository'

@Module({
	providers: [PrismaService, CustomerRepository],
	exports: [PrismaService, CustomerRepository],
})
export class DatabaseModule {}
