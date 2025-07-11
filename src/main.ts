import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import type { Env } from './env/env'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	// const configService: ConfigService<Env, true> = app.get(ConfigService)
	// const port = configService.get('PORT', { infer: true })

	await app.listen(3000)
}
bootstrap()
