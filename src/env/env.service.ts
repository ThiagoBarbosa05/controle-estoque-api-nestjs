import { Injectable } from '@nestjs/common'
// biome-ignore lint/style/useImportType: <explanation>
import { ConfigService } from '@nestjs/config'
import type { Env } from './env'

@Injectable()
export class EnvService {
	constructor(private configService: ConfigService<Env, true>) {}

	get<T extends keyof Env>(key: T) {
		return this.configService.get(key, { infer: true })
	}
}
