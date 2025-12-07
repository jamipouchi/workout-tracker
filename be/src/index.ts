import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
    workout_tracker: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors({
    origin: 'https://workout-tracker.miquelpuigturon.com'
}));

app.get('/workouts', async (c) => {
    try {
        const { results } = await c.env.workout_tracker.prepare("SELECT * FROM workouts").all();
        return c.json(results);
    } catch (e) {
        return c.json({ error: (e as Error).message }, 500);
    }
});

app.get('/workouts/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const workout = await c.env.workout_tracker.prepare("SELECT * FROM workouts WHERE id = ?").bind(id).first();
        if (!workout) return c.json({ error: 'Workout not found' }, 404);
        return c.json(workout);
    } catch (e) {
        return c.json({ error: (e as Error).message }, 500);
    }
});

app.get('/sessions/:workout_id', async (c) => {
    const workout_id = c.req.param('workout_id');
    try {
        const { results } = await c.env.workout_tracker
            .prepare("SELECT * FROM sessions WHERE workout_id = ? ORDER BY date ASC")
            .bind(workout_id)
            .all();

        return c.json(results);
    } catch (e) {
        return c.json({ error: (e as Error).message }, 500);
    }
});

app.post('/sessions', async (c) => {
    try {
        const body = await c.req.json();
        const { workout_id, value, successful, label } = body;

        if (!workout_id || value === undefined || !label) {
            return c.json({ error: 'Missing required fields: workout_id, value, or label' }, 400);
        }

        const id = crypto.randomUUID();
        const date = new Date().toISOString();
        const successVal = successful === undefined ? true : successful;

        await c.env.workout_tracker.prepare(
            "INSERT INTO sessions (id, workout_id, value, label, successful, date) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(id, workout_id, value, label, successVal ? 1 : 0, date).run();

        const newSession = {
            id,
            workout_id,
            value,
            successful: successVal,
            label,
            date
        };

        return c.json(newSession, 201);
    } catch (e) {
        return c.json({ error: (e as Error).message }, 500);
    }
});

export default app;
