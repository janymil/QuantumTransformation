import { useRef } from "react";

export default function DebugTest() {
  const testRef = useRef<HTMLDivElement>(null);
  
  return (
    <div ref={testRef} className="p-4">
      <h1>Debug Test Component</h1>
      <p>Testing React ref functionality</p>
    </div>
  );
}