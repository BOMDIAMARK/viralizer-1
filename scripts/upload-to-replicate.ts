import Replicate from "replicate"
import fs from "fs"
import path from "path"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

async function uploadTrainingData() {
  try {
    console.log("🚀 Iniciando upload do dataset para Replicate...")

    // Caminho para o arquivo de treinamento
    const trainingFilePath = path.join(process.cwd(), "training-data", "viralizer-training.jsonl")

    if (!fs.existsSync(trainingFilePath)) {
      throw new Error("Arquivo de treinamento não encontrado. Execute primeiro: npm run prepare-training-data")
    }

    // Ler o arquivo
    const trainingData = fs.readFileSync(trainingFilePath, "utf-8")

    // Criar um arquivo temporário para upload
    const blob = new Blob([trainingData], { type: "application/jsonl" })

    console.log("📤 Fazendo upload do dataset...")

    // Upload do arquivo para Replicate
    const file = await replicate.files.create(blob)

    console.log("✅ Dataset enviado com sucesso!")
    console.log("📁 URL do arquivo:", file.urls.get)

    return file.urls.get
  } catch (error) {
    console.error("❌ Erro ao fazer upload:", error)
    throw error
  }
}

async function createFineTunedModel(datasetUrl: string) {
  try {
    console.log("🔧 Iniciando fine-tuning do modelo...")

    const training = await replicate.trainings.create(
      "meta",
      "llama-2-70b-chat",
      "f1d50bb24186c52daae319ca8366e53debdaa9e0ae7ff976e918df752732ccc4",
      {
        destination: `${process.env.REPLICATE_USERNAME}/viralizer-assistant`,
        input: {
          train_data: datasetUrl,
          num_train_epochs: 3,
          learning_rate: 0.00002,
          batch_size: 4,
          max_seq_length: 2048,
          lora_rank: 16,
          lora_alpha: 16,
          lora_dropout: 0.1,
        },
      },
    )

    console.log("🎯 Treinamento iniciado!")
    console.log("📊 ID do treinamento:", training.id)
    console.log("🔗 URL:", `https://replicate.com/p/${training.id}`)

    return training
  } catch (error) {
    console.error("❌ Erro ao iniciar treinamento:", error)
    throw error
  }
}

// Função principal
async function main() {
  try {
    // 1. Upload do dataset
    const datasetUrl = await uploadTrainingData()

    // 2. Iniciar fine-tuning
    const training = await createFineTunedModel(datasetUrl)

    console.log("\n🎉 Processo iniciado com sucesso!")
    console.log("⏱️  O treinamento pode levar de 30 minutos a algumas horas.")
    console.log("📧 Você receberá um email quando estiver pronto.")
    console.log(`🔗 Acompanhe em: https://replicate.com/p/${training.id}`)
  } catch (error) {
    console.error("💥 Erro no processo:", error)
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
}

export { uploadTrainingData, createFineTunedModel }
