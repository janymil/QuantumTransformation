import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'hsl(var(--surface))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'hsl(var(--foreground))',
          backdropFilter: 'blur(12px)',
        },
      }}
    />
  )
}