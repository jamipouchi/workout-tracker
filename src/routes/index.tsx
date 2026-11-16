import { Title } from "@solidjs/meta";
import { createSignal } from "solid-js";

export default function Home() {
  const [shimmering, setShimmering] = createSignal(true);

  return (
    <main class="container flex-center" style={{ "text-align": "center", "justify-content": "center", "min-height": "80vh" }}>
      <Title>Workout Tracker</Title>

      <div>
        <h1
          class="mb-4"
          classList={{ "animate-shimmer": shimmering() }}
          onAnimationEnd={() => setShimmering(false)}
        >
          Workout Tracker
        </h1>
        <p class="subtitle mb-8">
          The best way to improve is by having goals
          <br />
          The best way to achieve them is by tracking
        </p>

        <div class="flex-center gap-4">
          <a href="/log" class="btn">Start Logging</a>
          <a href="/view" class="btn btn-secondary">View Progress</a>
        </div>
      </div>
    </main>
  );
}
