import { testReplicateConnection, checkCustomModelStatus } from "@/lib/replicate-client"

async function main() {
  console.log("🧪 Testando conexão com Replicate...")

  // Testar conexão básica
  const connectionTest = await testReplicateConnection()

  if (connectionTest.success) {
    console.log("✅ Conexão com Replicate funcionando!")
    console.log("📋 Modelos disponíveis:", connectionTest.models.join(", "))
  } else {
    console.log("❌ Erro na conexão:", connectionTest.error)
    return
  }

  // Verificar modelo personalizado
  console.log("\n🔍 Verificando modelo personalizado...")
  const customModelStatus = await checkCustomModelStatus()

  if (customModelStatus.available) {
    console.log("✅ Modelo personalizado disponível!")
    console.log("🤖 ID do modelo:", customModelStatus.modelId)
  } else {
    console.log("⚠️ Modelo personalizado não disponível")
    console.log("📝 Motivo:", customModelStatus.error)
    console.log("💡 Dica: Configure VIRALIZER_MODEL_ID ou use o modelo padrão")
  }

  console.log("\n🎉 Teste concluído!")
}

if (require.main === module) {
  main().catch(console.error)
}
