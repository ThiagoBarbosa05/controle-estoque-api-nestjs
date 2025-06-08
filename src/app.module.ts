import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { envSchema } from './env/env'

import { EnvModule } from './env/env.module'
import { DatabaseModule } from './db/database.module'
import { UserModule } from './user/user.module'
import { WineService } from './wine/wine.service';

@Module({
	imports: [
		ConfigModule.forRoot({
			validate: (env) => envSchema.parse(env),
			isGlobal: true,
		}),
		EnvModule,
		DatabaseModule,
	],
	providers: [WineService],
})
export class AppModule {}
