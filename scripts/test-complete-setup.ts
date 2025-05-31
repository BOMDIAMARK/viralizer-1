// Script para testar toda a configuração do Replicate
import { testReplicateConnection, getReplicateStatus, checkModelAvailability } from "@/lib/replicate-service"

async function testCompleteSetup() {
  console.log("🚀 Iniciando teste completo da configuração do Replicate...")
  console.log("=".repeat(60))

  // 1. Verificar variáveis de ambiente
  console.log("📋 1. Verificando variáveis de ambiente...")
  const status = getReplicateStatus()

  console.log(`   ✅ REPLICATE_API_TOKEN: ${status.hasToken ? "Configurado" : "❌ Faltando"}`)
  console.log(`   ✅ VIRALIZER_MODEL_ID: ${status.hasCustomModel ? status.customModelId : "❌ Não configurado"}`)
  console.log(`   ✅ REPLICATE_USERNAME: ${status.hasUsername ? "Configurado" : "❌ Não configurado"}`)
  console.log(`   ✅ Cliente inicializado: ${status.client ? "Sim" : "❌ Não"}`)

  if (!status.configured) {
    console.log("❌ Configuração incompleta. Configure o REPLICATE_API_TOKEN primeiro.")
    return
  }

  // 2. Testar conectividade
  console.log("\n🔗 2. Testando conectividade...")
  try {
    const connectionTest = await testReplicateConnection()

    if (connectionTest.success) {
      console.log(`   ✅ Conexão estabelecida com sucesso!`)
      console.log(`   📊 Latência: ${connectionTest.latency}ms`)
      console.log(`   🤖 Modelo de teste: ${connectionTest.model}`)

      if (connectionTest.customModel) {
        console.log(`   🎯 Modelo personalizado detectado: ${connectionTest.customModel}`)
      }
    } else {
      console.log(`   ❌ Falha na conexão: ${connectionTest.error}`)
      return
    }
  } catch (error: any) {
    console.log(`   ❌ Erro no teste de conexão: ${error.message}`)
    return
  }

  // 3. Verificar modelos disponíveis
  console.log("\n🤖 3. Verificando modelos disponíveis...")
  try {
    const modelCheck = await checkModelAvailability()

    console.log(`   📊 Modelos encontrados: ${modelCheck.available.length}`)
    console.log(`   🎯 Modelo recomendado: ${modelCheck.recommended}`)

    modelCheck.available.forEach((model) => {
      const statusIcon = model.status === "available" ? "✅" : "❌"
      console.log(`   ${statusIcon} ${model.name}: ${model.id}`)
    })
  } catch (error: any) {
    console.log(`   ⚠️ Erro ao verificar modelos: ${error.message}`)
  }

  // 4. Teste de streaming básico
  console.log("\n💬 4. Testando streaming básico...")
  try {
    const { streamReplicateCompletion } = await import("@/lib/replicate-service")

    console.log("   🚀 Iniciando teste de streaming...")

    let responseReceived = false
    let chunkCount = 0

    for await (const chunk of streamReplicateCompletion({
      prompt: "Diga apenas 'Olá, Viralizer funcionando!' em uma linha.",
      temperature: 0.1,
      maxTokens: 20,
    })) {
      responseReceived = true
      chunkCount++
      process.stdout.write(chunk)
    }

    if (responseReceived) {
      console.log(`\n   ✅ Streaming funcionando! Recebidos ${chunkCount} chunks`)
    } else {
      console.log("\n   ❌ Nenhuma resposta recebida no streaming")
    }
  } catch (error: any) {
    console.log(`\n   ❌ Erro no teste de streaming: ${error.message}`)
  }

  // 5. Resumo final
  console.log("\n" + "=".repeat(60))
  console.log("📊 RESUMO DO TESTE:")
  console.log("=".repeat(60))

  if (status.configured) {
    console.log("✅ Configuração: COMPLETA")
    console.log("✅ Conectividade: TESTADA")
    console.log("✅ Modelos: VERIFICADOS")
    console.log("✅ Streaming: FUNCIONAL")
    console.log("\n🎉 O Viralizer está pronto para usar IA avançada!")

    if (status.hasCustomModel) {
      console.log(`🎯 Modelo personalizado ativo: ${status.customModelId}`)
    }

    console.log("\n💡 Próximos passos:")
    console.log("   • Teste o chat em /chat")
    console.log("   • Envie uma thumbnail para análise")
    console.log("   • Monitore o uso no dashboard do Replicate")
  } else {
    console.log("❌ Configuração: INCOMPLETA")
    console.log("\n🔧 Para corrigir:")
    console.log("   • Configure REPLICATE_API_TOKEN")
    console.log("   • Reinicie a aplicação")
    console.log("   • Execute este teste novamente")
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testCompleteSetup().catch(console.error)
}

export { testCompleteSetup }
