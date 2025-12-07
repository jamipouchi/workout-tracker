import { Title } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";

export default function NotFound() {
  return (
    <main class="container flex-center" style={{ "text-align": "center", "justify-content": "center", "min-height": "80vh" }}>
      <Title>Page Not Found</Title>
      <HttpStatusCode code={404} />
      
      <div>
        <h1 class="mb-4">404: Page Not Found</h1>
        
        <p class="subtitle mb-8">
          The page you are looking for does not exist or has been moved.
        </p>

        <div class="flex-center">
          <a href="/" class="btn">
            Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}
