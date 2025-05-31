import { replicate } from "@/lib/replicate-service"

// Script para configurar e verificar modelo personalizado
async function setupCustomModel() {
  console.log("🚀 Configurando modelo personalizado do Viralizer...")

  // Verificar se o token está configurado
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("❌ REPLICATE_API_TOKEN não configurado")
    return
  }

  // Modelos recomendados para o Viralizer
  const RECOMMENDED_MODELS = {
    // Modelos OpenAI (melhores para análise de imagem e chat)
    gpt4_vision: "openai/gpt-4-vision-preview",
    gpt4o: "openai/gpt-4o",
    gpt4o_mini: "openai/gpt-4o-mini",

    // Modelos Llama especializados
    llama_vision: "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
    llama_code: "meta/codellama-70b-instruct:a279116fe47a0f65701a8817188601e2fe8f4b9e04a518789655ea7b995851bf",

    // Modelos especializados em criatividade
    mixtral_creative:
      "mistralai/mixtral-8x7b-instruct-v0.1:cf18decbf51c27fed6bbdc3492312c1c903222a56e3fe9ca02d6cbe5198afc10",
    claude_haiku: "anthropic/claude-3-haiku:07c34b4bed13c90fa0fdb6e7d74c7f91a1e6824e5a3d2d3bb0d2e8b8e0e8e8e8",

    // Modelos de imagem (para análise visual)
    blip_caption: "salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746",
    clip_interrogator:
      "pharmapsychotic/clip-interrogator:a4a8bafd6089e1716b06057c42b19378250d008b80fe87caa5cd36d40c1eda90",
  }

  console.log("\n📋 Modelos recomendados para o Viralizer:")
  console.log("=".repeat(60))

  for (const [name, id] of Object.entries(RECOMMENDED_MODELS)) {
    console.log(`${name.padEnd(20)} | ${id}`)
  }

  console.log("\n🎯 Recomendações por uso:")
  console.log("=".repeat(60))
  console.log("📸 Análise de thumbnails: gpt4o ou gpt4_vision")
  console.log("💬 Chat criativo: mixtral_creative ou gpt4o_mini")
  console.log("🔍 Análise visual: blip_caption ou clip_interrogator")
  console.log("⚡ Performance/custo: gpt4o_mini")
  console.log("🚀 Máxima qualidade: gpt4o")

  // Testar modelos disponíveis
  console.log("\n🔍 Testando disponibilidade dos modelos...")
  console.log("=".repeat(60))

  const testResults = []

  for (const [name, modelId] of Object.entries(RECOMMENDED_MODELS)) {
    try {
      console.log(`Testando ${name}...`)

      // Teste simples para verificar se o modelo está disponível
      const startTime = Date.now()

      await replicate.run(modelId as any, {
        input: {
          prompt: "Hello",
          max_new_tokens: 5,
          temperature: 0.1,
        },
      })

      const latency = Date.now() - startTime
      testResults.push({ name, modelId, status: "✅ Disponível", latency })
      console.log(`  ✅ ${name} - ${latency}ms`)
    } catch (error: any) {
      testResults.push({ name, modelId, status: "❌ Indisponível", error: error.message })
      console.log(`  ❌ ${name} - ${error.message}`)
    }
  }

  // Resumo dos resultados
  console.log("\n📊 Resumo dos testes:")
  console.log("=".repeat(60))

  const available = testResults.filter((r) => r.status.includes("✅"))
  const unavailable = testResults.filter((r) => r.status.includes("❌"))

  console.log(`✅ Modelos disponíveis: ${available.length}`)
  console.log(`❌ Modelos indisponíveis: ${unavailable.length}`)

  if (available.length > 0) {
    console.log("\n🎯 Modelo recomendado para configurar:")
    const recommended =
      available.find((m) => m.name === "gpt4o") || available.find((m) => m.name === "gpt4o_mini") || available[0]

    console.log(`VIRALIZER_MODEL_ID=${recommended.modelId}`)
    console.log(`\n📝 Para configurar no Vercel:`)
    console.log(`1. Acesse: https://vercel.com/dashboard`)
    console.log(`2. Vá em Settings > Environment Variables`)
    console.log(`3. Adicione: VIRALIZER_MODEL_ID`)
    console.log(`4. Valor: ${recommended.modelId}`)
    console.log(`5. Redeploy o projeto`)
  }

  return testResults
}

// Executar se chamado diretamente
if (require.main === module) {
  setupCustomModel().catch(console.error)
}

export { setupCustomModel }
