import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

function MinimalApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto py-8">
          <h1 className="text-2xl font-bold mb-4">AI Intelligence Layer</h1>
          <p>System loading...</p>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default MinimalApp;