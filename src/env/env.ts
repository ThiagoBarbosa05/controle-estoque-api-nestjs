import { z } from 'zod'

export const envSchema = z.object({
	DATABASE_URL: z.string().url(),
	JWT_SECRET: z.string().min(1),
	PORT: z.coerce.number().optional().default(3333),
})

export type Env = z.infer<typeof envSchema>
