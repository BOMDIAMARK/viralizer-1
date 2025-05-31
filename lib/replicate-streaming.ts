import Replicate from "replicate"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

// Configuração específica para o GPT-4o
export interface GPTStreamingOptions {
  prompt: string
  imageInput?: Array<{ value: string }>
  systemPrompt?: string
  temperature?: number
  topP?: number
  presencePenalty?: number
  frequencyPenalty?: number
  maxCompletionTokens?: number
}

// Prompt do sistema otimizado para o Viralizer
const VIRALIZER_SYSTEM_PROMPT = `Você é o BOT Criativo da Viralizer, um assistente especializado em ajudar criadores de conteúdo a conceitualizarem e otimizarem thumbnails personalizadas para seus vídeos do YouTube. A Viralizer é uma plataforma inovadora que permite aos criadores gerar thumbnails profissionais usando seus próprios clones digitais criados com IA.

Sua função:
- Desenvolver conceitos visuais impactantes
- Otimizar thumbnails para maior taxa de clique (CTR)
- Orientar sobre estilos (Show, Speed, Rico) e composição visual
- Guiar o usuário pelo processo de criação de clone e geração na Viralizer
- Educar sobre consistência visual e identidade de marca

Seu tom de voz:
- Inspirador, direto, acolhedor
- Profissional sem ser frio
- Especialista sem ser condescendente

Palavras a usar:
- Amplificar, Autêntico, Destacar, Criar, Transformar
Palavras a evitar:
- Revolucionário, Game-changer, Inacreditável, Único

Mensagens-chave:
- "Seu clone digital, suas thumbnails virais."
- "De horas para segundos, de amador para profissional."
- "Thumbnails que convertem em cliques."
- "Sua identidade visual, consistente em cada vídeo."

Adapte respostas ao tipo de criador (iniciante, intermediário, profissional, estúdio) e sempre foque em thumbnails para YouTube. Evite conselhos fora da identidade visual e mantenha alinhamento com os valores da marca.`

// Função para streaming com GPT-4o
export async function* streamGPTCompletion(options: GPTStreamingOptions) {
  try {
    const input = {
      prompt: options.prompt,
      system_prompt: options.systemPrompt || VIRALIZER_SYSTEM_PROMPT,
      temperature: options.temperature || 1,
      top_p: options.topP || 1,
      presence_penalty: options.presencePenalty || 0,
      frequency_penalty: options.frequencyPenalty || 0,
      max_completion_tokens: options.maxCompletionTokens || 4096,
      ...(options.imageInput && { image_input: options.imageInput }),
    }

    console.log("🚀 Iniciando streaming com GPT-4o...")

    for await (const event of replicate.stream("openai/gpt-4o", { input })) {
      yield event.toString()
    }
  } catch (error: any) {
    console.error("❌ Erro no streaming:", error)
    yield `Erro: ${error.message}`
  }
}

// Função para streaming sem imagem (mais rápida)
export async function* streamTextCompletion(prompt: string, systemPrompt?: string) {
  yield* streamGPTCompletion({
    prompt,
    systemPrompt,
    temperature: 0.7,
    topP: 0.9,
  })
}

// Função para streaming com análise de imagem
export async function* streamImageAnalysis(prompt: string, imageUrl: string) {
  yield* streamGPTCompletion({
    prompt,
    imageInput: [{ value: imageUrl }],
    temperature: 0.8,
    topP: 0.95,
  })
}
