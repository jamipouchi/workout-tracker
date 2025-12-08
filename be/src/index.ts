import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
	workout_tracker: D1Database
	API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(
	'/*',
	cors({
		origin: ['https://workout-tracker.miquelpuigturon.com', 'http://localhost:3000'],
	})
)

app.use('/*', async (c, next) => {
	if (c.req.method === 'OPTIONS' || c.req.method === 'GET') {
		await next()
		return
	}
	const apiKey = c.req.header('X-API-Key')
	if (!apiKey || apiKey !== c.env.API_KEY) {
		return c.json({ error: 'Unauthorized' }, 401)
	}
	await next()
})

app.get('/workouts', async (c) => {
	try {
		const { results } = await c.env.workout_tracker.prepare('SELECT * FROM workouts').all()
		return c.json(results)
	} catch (e) {
		return c.json({ error: (e as Error).message }, 500)
	}
})

app.get('/sessions/:workout_id', async (c) => {
	const workout_id = c.req.param('workout_id')
	try {
		const { results } = await c.env.workout_tracker
			.prepare('SELECT * FROM sessions WHERE workout_id = ? ORDER BY date ASC')
			.bind(workout_id)
			.all()

		return c.json(
			results.map((session) => ({
				...session,
				successful: session.successful === 1,
			}))
		)
	} catch (e) {
		return c.json({ error: (e as Error).message }, 500)
	}
})

app.post('/sessions', async (c) => {
	try {
		const body = await c.req.json()
		const { workout_id, value, successful, label, description } = body

		if (!workout_id || value === undefined || !label) {
			return c.json({ error: 'Missing required fields: workout_id, value, or label' }, 400)
		}

		const id = crypto.randomUUID()
		const date = new Date().toISOString()
		const successVal = successful === true

		await c.env.workout_tracker
			.prepare(
				'INSERT INTO sessions (id, workout_id, value, label, successful, date, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
			)
			.bind(id, workout_id, value, label, successVal ? 1 : 0, date, description || null)
			.run()

		const newSession = {
			id,
			workout_id,
			value,
			successful: successVal,
			label,
			description,
			date,
		}

		return c.json(newSession, 201)
	} catch (e) {
		return c.json({ error: (e as Error).message }, 500)
	}
})

export default app
