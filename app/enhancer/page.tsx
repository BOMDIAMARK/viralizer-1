import { EnhancerInterface } from "./components/enhancer-interface"

export default function EnhancerPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Enhancer</h1>
          <p className="text-muted-foreground">Aprimore suas imagens com upscaling e detalhamento por IA</p>
        </div>
        <EnhancerInterface />
      </div>
    </div>
  )
}
