import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

function SimpleApp() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AI Coaching Platform
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Document processing system operational
        </p>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          System Status: Running on Port 5000
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SimpleApp />
    </QueryClientProvider>
  );
}

export default App;