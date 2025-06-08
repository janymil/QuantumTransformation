import { createRoot } from "react-dom/client";

function CleanApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Clean Test Application</h1>
      <p>Testing React without any external dependencies</p>
      <button onClick={() => alert('React is working!')}>
        Test Button
      </button>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<CleanApp />);