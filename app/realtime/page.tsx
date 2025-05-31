import { RealtimeInterface } from "./components/realtime-interface"

export default function RealtimePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Geração em Tempo Real</h1>
          <p className="text-muted-foreground">Crie e modifique imagens em tempo real com IA</p>
        </div>
        <RealtimeInterface />
      </div>
    </div>
  )
}
