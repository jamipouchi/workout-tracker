import { createSignal, createEffect, onCleanup, Show, For, Suspense, createResource } from 'solid-js'
import { api, type Workout, type Session } from '~/lib/api'
import Chart from 'chart.js/auto'
import PageHeader from '~/components/PageHeader'

export default function View() {
    const [workouts] = createResource(() => api.getWorkouts(), { initialValue: [], ssrLoadFrom: 'initial' })
    const [selectedWorkoutId, setSelectedWorkoutId] = createSignal('')

    const [sessions] = createResource(selectedWorkoutId, async (wid) => {
        if (!wid) return []
        return api.getSessions(wid)
    }, { initialValue: [], ssrLoadFrom: 'initial' })

    const selectedWorkout = () => workouts()?.find((w) => w.id === selectedWorkoutId())

    return (
        <div class="container" style={{ 'max-width': '900px' }}>
            <PageHeader />

            <h1>View Progress</h1>

            <div class="card">
                <div style={{ 'margin-bottom': '2rem' }}>
                    <label for="workout">Select Workout</label>
                    <Suspense fallback={<p>Loading workouts...</p>}>
                        <select
                            id="workout"
                            value={selectedWorkoutId()}
                            onChange={(e) => setSelectedWorkoutId(e.currentTarget.value)}
                        >
                            <option value="" disabled>
                                -- Choose a workout --
                            </option>
                            <For each={workouts()}>
                                {(workout) => <option value={workout.id}>{workout.name}</option>}
                            </For>
                        </select>
                    </Suspense>
                </div>

                <Suspense
                    fallback={
                        <div
                            style={{
                                'text-align': 'center',
                                'margin-top': '1.5rem',
                                color: '#666',
                                height: '400px',
                                display: 'flex',
                                'align-items': 'center',
                                'justify-content': 'center',
                            }}
                        >
                            Loading chart data...
                        </div>
                    }
                >
                    <Show
                        when={selectedWorkoutId()}
                        fallback={
                            <p style={{ 'text-align': 'center', color: '#666', 'margin-top': '2rem' }}>
                                Select a workout to view progress.
                            </p>
                        }
                    >
                        <SessionChart sessions={sessions} workout={selectedWorkout()} />
                    </Show>
                </Suspense>
            </div>
        </div>
    )
}

function SessionChart(props: { sessions: () => Session[] | undefined; workout: Workout | undefined }) {
    let chartInstance: Chart | undefined
    onCleanup(() => chartInstance?.destroy())

    const [canvasRef, setCanvasRef] = createSignal<HTMLCanvasElement>()

    const updateChart = (data: Session[], workout: Workout, canvas: HTMLCanvasElement) => {
        if (!canvas) return

        if (chartInstance) {
            // @ts-ignore
            chartInstance.options.scales.y.title.text = workout.unit
        } else {
            chartInstance = new Chart(canvas, {
                type: 'line',
                data: { labels: [], datasets: [] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                        legend: { labels: { color: '#0f172a' } },
                        tooltip: {
                            callbacks: {
                                afterBody: (context) => {
                                    const raw = context[0].raw as any
                                    return raw?.description ? [raw.description] : []
                                },
                            },
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: { color: '#e2e8f0' },
                            ticks: { color: '#64748b' },
                            title: { display: true, text: workout.unit },
                        },
                        x: { grid: { color: '#e2e8f0' }, ticks: { color: '#64748b' } },
                    },
                },
            })
        }

        if (!chartInstance) return

        const groups: Record<string, Session[]> = {}
        const labelsSet = new Set<string>()

        // Normalize date to YYYY-MM-DD to handle both short dates and ISO timestamps consistently
        const getDateKey = (dateStr: string) => dateStr.split('T')[0]

        data.forEach((s) => {
            const labelKey = s.label || 'Default'
            if (!groups[labelKey]) {
                groups[labelKey] = []
            }
            groups[labelKey].push(s)
            labelsSet.add(getDateKey(s.date))
        })

        const sortedDates = Array.from(labelsSet).sort(
            (a, b) => new Date(a).getTime() - new Date(b).getTime()
        )

        const colors = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6']

        const datasets = Object.keys(groups).map((key, index) => {
            const groupData = groups[key]
            const dataPoints = sortedDates.map((dateKey) => {
                const session = groupData.find((s) => getDateKey(s.date) === dateKey)
                const x = new Date(dateKey + 'T00:00:00').toLocaleDateString()
                return session
                    ? {
                        x,
                        y: session.value,
                        description: session.description,
                        successful: session.successful,
                    }
                    : {
                        x,
                        y: null,
                    }
            })
            const color = colors[index % colors.length]
            return {
                label:
                    key === 'Default'
                        ? `${workout.name} ${workout.label_unit}`
                        : `${key} ${workout.label_unit}`,
                data: dataPoints,
                borderColor: color,
                backgroundColor: color,
                pointBackgroundColor: (ctx: any) => {
                    const val = ctx.raw
                    if (val && !val.successful) return '#ef4444'
                    return color
                },
                pointBorderColor: (ctx: any) => {
                    const val = ctx.raw
                    if (val && !val.successful) return '#ef4444'
                    return color
                },
                tension: 0.3,
                fill: false,
                spanGaps: true,
            }
        })

        chartInstance.data.labels = sortedDates.map((d) => new Date(d).toLocaleDateString())
        chartInstance.data.datasets = datasets as any
        chartInstance.update()
    }

    createEffect(() => {
        const data = props.sessions()
        const workout = props.workout
        const canvas = canvasRef()

        if (data && data.length > 0 && workout && canvas) {
            updateChart(data, workout, canvas)
        }
    })

    return (
        <>
            <div
                class="chart-container"
                style={{
                    display: props.sessions()?.length ? 'block' : 'none',
                    'margin-top': '1.5rem',
                }}
            >
                <canvas ref={setCanvasRef}></canvas>
            </div>

            <Show when={!props.sessions() || props.sessions()?.length === 0}>
                <p style={{ 'text-align': 'center', color: '#666', 'margin-top': '2rem' }}>
                    No sessions recorded yet.
                </p>
            </Show>

            <style>
                {`
                .chart-container {
                    position: relative;
                    height: 400px;
                    width: 100%;
                }
                `}
            </style>
        </>
    )
}
