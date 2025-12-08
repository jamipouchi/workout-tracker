import { createSignal, Show, For, Suspense, createEffect, onCleanup } from 'solid-js'
import { Portal } from 'solid-js/web'
import { action } from '@solidjs/router'
import { api } from '~/lib/api'
import PageHeader from '~/components/PageHeader'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'

const NEW_LABEL = 'new'

export default function Log() {
    const workoutsQuery = useQuery(() => ({
        queryKey: ['workouts'],
        queryFn: api.getWorkouts,
        staleTime: Infinity
    }))
    const [selectedWorkoutId, setSelectedWorkoutId] = createSignal<string | null>(null)
    const selectedWorkout = () => workoutsQuery.data?.find((w) => w.id === selectedWorkoutId())

    const sessions = useQuery(() => ({
        queryKey: ['sessions', selectedWorkoutId()],
        queryFn: () => api.getSessions(selectedWorkoutId()!),
        enabled: !!selectedWorkoutId(),
        staleTime: Infinity
    }))
    const existingLabels = () => {
        if (!sessions.data) {
            return
        }
        const labels = new Set(sessions.data.map((session) => session.label))
        return Array.from(labels)
            .filter((l): l is string => !!l)
            .sort()
    }
    const [selectedLabel, setSelectedLabel] = createSignal('')

    createEffect(() => {
        selectedWorkoutId();
        setSelectedLabel('')
    })

    let form!: HTMLFormElement
    const [showSuccessNotification, setShowSuccessNotification] = createSignal(false)
    const queryClient = useQueryClient()
    const createSessionMutation = useMutation(() => ({
        mutationFn: api.addSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions', selectedWorkoutId()] })
            setSelectedWorkoutId(null)
            form.reset()
            setShowSuccessNotification(true)
            const timer = setTimeout(() => {
                setShowSuccessNotification(false)
            }, 2_000)
            onCleanup(() => clearTimeout(timer))
        }
    }))

    const saveSession = action(async (workoutId: string, formData: FormData) => {
        const value = formData.get('value') as string
        const selectedLabel = formData.get('selectedLabel') as string
        const successfulStr = formData.get('successful') as string
        const description = formData.get('description') as string

        const label = selectedLabel === NEW_LABEL ? (formData.get('label') as string) : selectedLabel
        const successful = successfulStr === 'on'

        return createSessionMutation.mutateAsync({ workoutId, value: Number(value), successful, label, description })
    }, 'log')

    return (
        <div class="container" style={{ 'max-width': '900px' }}>
            <PageHeader action={{ href: '/view', label: 'View Progress' }} />

            <Show when={showSuccessNotification()}>
                <Portal>
                    <div class="toast-notification">
                        <div class="icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                        <div>
                            <div class="title">Success</div>
                            <div class="message">Session logged successfully</div>
                        </div>
                    </div>
                </Portal>
            </Show>

            <style>
                {`
                .toast-notification {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    background: white;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    border: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    z-index: 9999;
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    min-width: 300px;
                }
                
                @media (max-width: 640px) {
                    .toast-notification {
                        bottom: 1rem;
                        right: 1rem;
                        left: 1rem;
                        min-width: auto;
                    }
                }

                .toast-notification .icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #10b981; /* Green-500 */
                    background: #d1fae5; /* Green-100 */
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                
                .toast-notification .icon svg {
                    width: 18px;
                    height: 18px;
                }

                .toast-notification .title {
                    font-weight: 600;
                    color: #0f172a;
                    font-size: 0.95rem;
                    line-height: 1.2;
                }
                
                .toast-notification .message {
                    color: #64748b;
                    font-size: 0.875rem;
                    line-height: 1.2;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}
            </style>

            <h1>Log Workout</h1>

            <div class="card mb-8">
                <Suspense fallback={<div>Loading workouts...</div>}>
                    <div class="mb-4">
                        <label for="workout">Select Workout</label>
                        <select
                            id="workout"
                            value={selectedWorkoutId() ?? ''}
                            onChange={(e) => setSelectedWorkoutId(e.currentTarget.value)}
                        >
                            <option value="" disabled>
                                -- Choose a workout --
                            </option>
                            <For each={workoutsQuery.data}>
                                {(workout) => <option value={workout.id}>{workout.name}</option>}
                            </For>
                        </select>
                    </div>
                </Suspense>

                <Show when={!workoutsQuery.isLoading && selectedWorkout()}>
                    {(workout) => (
                        <form ref={form} action={saveSession.with(workout().id)} method="post" class="mt-4">
                            <div class="mb-4">
                                <label for="value">Result ({workout().unit})</label>
                                <input type="number" name="value" id="value" step="any" required />
                            </div>

                            <Suspense
                                fallback={
                                    <div class="mb-4">
                                        <label class="block text-sm font-medium text-gray-700">
                                            Label ({workout().label_unit})
                                        </label>
                                        <div class="block w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 animate-pulse flex items-center text-gray-500">
                                            Loading existing labels...
                                        </div>
                                    </div>
                                }
                            >
                                <div class="mb-4">
                                    <label for="label-select">Label ({workout().label_unit})</label>
                                    <select
                                        id="label-select"
                                        name="selectedLabel"
                                        value={selectedLabel()}
                                        onInput={(e) => setSelectedLabel(e.currentTarget.value)}
                                        required
                                    >
                                        <option value="" disabled>
                                            -- Select label --
                                        </option>
                                        <For each={existingLabels()}>
                                            {(l) => <option value={l}>{l || '(Default)'}</option>}
                                        </For>
                                        <option value={NEW_LABEL}>Add new...</option>
                                    </select>
                                </div>
                            </Suspense>

                            <Show when={selectedLabel() === NEW_LABEL}>
                                <div class="mb-4">
                                    <label for="label">New Label</label>
                                    <input
                                        type="text"
                                        id="label"
                                        name="label"
                                        placeholder={`e.g. +10${workout().label_unit}`}
                                        required
                                    />
                                </div>
                            </Show>

                            <div class="mb-4">
                                <label for="description">Description (optional)</label>
                                <input
                                    type="text"
                                    id="description"
                                    name="description"
                                    placeholder="e.g. Felt tired, early morning..."
                                />
                            </div>

                            <div class="checkbox-wrapper mb-8">
                                <input
                                    type="checkbox"
                                    id="successful"
                                    name="successful"
                                />
                                <label for="successful">Successful session</label>
                            </div>

                            <button type="submit">Log Session</button>
                        </form>
                    )}
                </Show>
            </div>
        </div >
    )
}
