import { object, string, minLength } from "valibot"

export const deleteImageSchema = object({
  id: string("ID da imagem inválido."),
})

export const updateImageSchema = object({
  id: string("ID da imagem inválido."),
  prompt: string("O prompt não pode ser vazio.", [minLength(1, "O prompt não pode ser vazio.")]),
  style: string("O estilo não pode ser vazio.", [minLength(1, "O estilo não pode ser vazio.")]),
})
