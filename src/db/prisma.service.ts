// biome-ignore lint/style/useImportType: <explanation>
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from 'prisma/generated'

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	constructor() {
		super({
			log: ['warn', 'error'],
		})
	}

	onModuleInit() {
		return this.$connect()
	}

	onModuleDestroy() {
		return this.$disconnect()
	}
}
