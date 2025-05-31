#!/usr/bin/env tsx

import { testReplicateConnection, checkModelAvailability, streamReplicateCompletion } from "../lib/replicate-service"

async function main() {
  console.log("🧪 Testando Integração com Replicate\n")

  // 1. Testar conexão básica
  console.log("1️⃣ Testando conexão...")
  const connectionTest = await testReplicateConnection()

  if (connectionTest.success) {
    console.log(`✅ Conectado! Modelo: ${connectionTest.model}`)
    console.log(`⚡ Latência: ${connectionTest.latency}ms\n`)
  } else {
    console.log(`❌ Falha na conexão: ${connectionTest.error}\n`)
    return
  }

  // 2. Verificar modelos disponíveis
  console.log("2️⃣ Verificando modelos disponíveis...")
  try {
    const modelStatus = await checkModelAvailability()
    console.log(`📋 Modelos disponíveis: ${modelStatus.available.length}`)
    console.log(`🎯 Recomendado: ${modelStatus.recommended}\n`)

    modelStatus.available.forEach((model) => {
      const status = model.status === "available" ? "✅" : "❌"
      console.log(`${status} ${model.name}`)
    })
  } catch (error) {
    console.log(`⚠️ Erro ao verificar modelos: ${error}\n`)
  }

  // 3. Teste de streaming
  console.log("\n3️⃣ Testando streaming...")
  try {
    const testPrompt = "Olá! Sou um criador de conteúdo sobre tecnologia. Como posso melhorar minhas thumbnails?"

    console.log("📝 Prompt:", testPrompt)
    console.log("🤖 Resposta:")
    console.log("─".repeat(50))

    let fullResponse = ""
    for await (const chunk of streamReplicateCompletion({
      prompt: testPrompt,
      temperature: 0.7,
      maxTokens: 500,
    })) {
      process.stdout.write(chunk)
      fullResponse += chunk
    }

    console.log("\n" + "─".repeat(50))
    console.log(`📊 Resposta completa: ${fullResponse.length} caracteres`)
    console.log("✅ Teste de streaming concluído!")
  } catch (error: any) {
    console.log(`❌ Erro no streaming: ${error.message}`)
  }

  // 4. Teste com imagem (se disponível)
  console.log("\n4️⃣ Testando análise de imagem...")
  try {
    const imageUrl =
      "https://replicate.delivery/pbxt/N5mxo2mW7Qa2jUviz9Jtnhm0qseGDiRGe0Tie8rpJOVokev2/Logo%20Extra%20-%20Dark.png"

    console.log("🖼️ Analisando imagem:", imageUrl)
    console.log("🤖 Análise:")
    console.log("─".repeat(50))

    for await (const chunk of streamReplicateCompletion({
      prompt: "Analise esta imagem e sugira melhorias para usar como thumbnail do YouTube.",
      imageInput: [{ value: imageUrl }],
      temperature: 0.8,
      maxTokens: 300,
    })) {
      process.stdout.write(chunk)
    }

    console.log("\n" + "─".repeat(50))
    console.log("✅ Teste de análise de imagem concluído!")
  } catch (error: any) {
    console.log(`❌ Erro na análise de imagem: ${error.message}`)
  }

  console.log("\n🎉 Todos os testes concluídos!")
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}

export { main as testReplicateIntegration }
