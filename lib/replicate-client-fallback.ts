// Implementação de cliente Replicate com fallback e retry
import Replicate from "replicate"

export class ReplicateClientWithFallback {
  private client: Replicate | null = null
  private token: string
  private retryCount = 3
  private retryDelay = 1000

  constructor(token: string) {
    this.token = token
    this.initialize()
  }

  private initialize() {
    try {
      this.client = new Replicate({
        auth: this.token,
      })
      console.log("✅ Cliente Replicate inicializado com sucesso")
    } catch (error) {
      console.error("❌ Falha ao inicializar cliente Replicate:", error)
      this.client = null
    }
  }

  async run(model: string, input: any, options: { retry?: boolean } = {}) {
    if (!this.client) {
      throw new Error("Cliente Replicate não inicializado")
    }

    const shouldRetry = options.retry !== false
    let lastError: Error | null = null

    for (let attempt = 0; attempt < (shouldRetry ? this.retryCount : 1); attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 Tentativa ${attempt + 1} de ${this.retryCount}...`)
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt))
        }

        return await this.client.run(model, { input })
      } catch (error: any) {
        console.warn(`⚠️ Tentativa ${attempt + 1} falhou:`, error.message)
        lastError = error

        // Reinicializar cliente se for erro de conexão
        if (error.message.includes("fetch") || error.message.includes("network")) {
          console.log("🔄 Reinicializando cliente Replicate...")
          this.initialize()
        }
      }
    }

    throw lastError || new Error("Falha ao executar modelo após múltiplas tentativas")
  }

  async *stream(model: string, input: any, options: { retry?: boolean } = {}) {
    if (!this.client) {
      throw new Error("Cliente Replicate não inicializado")
    }

    const shouldRetry = options.retry !== false
    let lastError: Error | null = null

    for (let attempt = 0; attempt < (shouldRetry ? this.retryCount : 1); attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 Tentativa ${attempt + 1} de ${this.retryCount} para stream...`)
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt))
        }

        for await (const chunk of this.client.stream(model, input)) {
          yield chunk
        }

        return
      } catch (error: any) {
        console.warn(`⚠️ Tentativa de stream ${attempt + 1} falhou:`, error.message)
        lastError = error

        // Reinicializar cliente se for erro de conexão
        if (error.message.includes("fetch") || error.message.includes("network")) {
          console.log("🔄 Reinicializando cliente Replicate para stream...")
          this.initialize()
        }
      }
    }

    throw lastError || new Error("Falha ao executar stream após múltiplas tentativas")
  }

  isInitialized() {
    return this.client !== null
  }
}

// Função para criar cliente com fallback
export function createReplicateClient(token: string | undefined): ReplicateClientWithFallback | null {
  if (!token) {
    console.warn("⚠️ Token Replicate não fornecido")
    return null
  }

  try {
    return new ReplicateClientWithFallback(token)
  } catch (error) {
    console.error("❌ Erro ao criar cliente Replicate com fallback:", error)
    return null
  }
}
