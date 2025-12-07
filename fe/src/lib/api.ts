const API_URL = import.meta.env.DEV ? 'http://localhost:8787' : 'https://api.workout-tracker.miquelpuigturon.com';

export interface Workout {
    id: string;
    name: string;
    unit: string;
    label_unit: string;
}

export interface Session {
    id: string;
    workout_id: string;
    value: number;
    successful: boolean;
    label?: string;
    description?: string;
    date: string;
}

export const api = {
    getWorkouts: async (): Promise<Workout[]> => {
        const res = await fetch(`${API_URL}/workouts`);
        if (!res.ok) throw new Error('Failed to fetch workouts');
        return res.json();
    },

    getSessions: async (workoutId: string): Promise<Session[]> => {
        const res = await fetch(`${API_URL}/sessions/${workoutId}`);
        if (!res.ok) throw new Error('Failed to fetch sessions');
        return res.json();
    },

    addSession: async ({ workoutId, value, successful, label = '', description = '' }: { workoutId: string, value: number, successful: boolean, label?: string, description?: string }): Promise<Session> => {
        const res = await fetch(`${API_URL}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ workout_id: workoutId, value, successful, label, description })
        });
        if (!res.ok) throw new Error('Failed to add session');
        return res.json();
    }
};
