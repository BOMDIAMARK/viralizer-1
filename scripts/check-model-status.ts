import Replicate from "replicate"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

async function checkTrainingStatus(trainingId: string) {
  try {
    const training = await replicate.trainings.get(trainingId)

    console.log("📊 Status do Treinamento:")
    console.log("🔄 Status:", training.status)
    console.log("⏱️  Criado em:", training.created_at)

    if (training.completed_at) {
      console.log("✅ Completado em:", training.completed_at)
    }

    if (training.status === "succeeded") {
      console.log("🎉 Modelo treinado com sucesso!")
      console.log("🔗 Modelo disponível em:", training.output.version)
      console.log("\n📝 Para usar o modelo, adicione esta variável de ambiente:")
      console.log(`VIRALIZER_MODEL_ID=${training.output.version}`)
    } else if (training.status === "failed") {
      console.log("❌ Treinamento falhou:")
      console.log("💥 Erro:", training.error)
    } else {
      console.log("⏳ Treinamento ainda em andamento...")
      console.log("🔗 Acompanhe em:", `https://replicate.com/p/${trainingId}`)
    }

    return training
  } catch (error) {
    console.error("❌ Erro ao verificar status:", error)
    throw error
  }
}

// Listar todos os treinamentos
async function listTrainings() {
  try {
    const trainings = await replicate.trainings.list()

    console.log("📋 Seus Treinamentos:")
    trainings.results.forEach((training, index) => {
      console.log(`\n${index + 1}. ID: ${training.id}`)
      console.log(`   Status: ${training.status}`)
      console.log(`   Criado: ${training.created_at}`)
      if (training.status === "succeeded") {
        console.log(`   Modelo: ${training.output?.version}`)
      }
    })

    return trainings.results
  } catch (error) {
    console.error("❌ Erro ao listar treinamentos:", error)
    throw error
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log("📋 Listando todos os treinamentos...")
    await listTrainings()
  } else {
    const trainingId = args[0]
    console.log(`🔍 Verificando status do treinamento: ${trainingId}`)
    await checkTrainingStatus(trainingId)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}

export { checkTrainingStatus, listTrainings }
