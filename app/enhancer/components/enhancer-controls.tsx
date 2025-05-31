"use client"

import type React from "react"
import { useEnhancerStore } from "@/stores/enhancerStore"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Download, Wand2 } from "lucide-react"

interface EnhancerControlsProps {
  onEnhance: () => void
}

export const EnhancerControls: React.FC<EnhancerControlsProps> = ({ onEnhance }) => {
  const { enhancementParams, setEnhancementParams, jobStatus, outputImageUrl } = useEnhancerStore()

  const isLoading = jobStatus === "processing" || jobStatus === "starting"

  const handleParamChange = (param: keyof typeof enhancementParams, value: any) => {
    setEnhancementParams({ [param]: value })
  }

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-medium">Configurações de Aprimoramento</h3>

      <div className="space-y-4">
        <div>
          <Label>Modelo</Label>
          <Select
            value={enhancementParams.model}
            onValueChange={(value) => handleParamChange("model", value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="faithful">Fiel (Upscale V1)</SelectItem>
              <SelectItem value="creative">Criativo (Krea Enhance)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Fator de Escala</Label>
          <Select
            value={enhancementParams.scaleFactor.toString()}
            onValueChange={(value) => handleParamChange("scaleFactor", Number.parseInt(value, 10))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1x (Denoise/Restore)</SelectItem>
              <SelectItem value="2">2x</SelectItem>
              <SelectItem value="4">4x</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Prompt (Opcional para Modo Criativo)</Label>
          <Input
            value={enhancementParams.prompt || ""}
            onChange={(e) => handleParamChange("prompt", e.target.value)}
            disabled={isLoading || enhancementParams.model !== "creative"}
            placeholder="Ex: dálmata de pelo áspero, bordas de aquarela"
          />
        </div>

        <div>
          <Label>AI Strength: {enhancementParams.aiStrength}%</Label>
          <Slider
            value={[enhancementParams.aiStrength]}
            onValueChange={(value) => handleParamChange("aiStrength", value[0])}
            max={100}
            step={1}
            disabled={isLoading}
            className="mt-2"
          />
        </div>

        <div>
          <Label>Resemblance: {enhancementParams.resemblance}%</Label>
          <Slider
            value={[enhancementParams.resemblance]}
            onValueChange={(value) => handleParamChange("resemblance", value[0])}
            max={100}
            step={1}
            disabled={isLoading}
            className="mt-2"
          />
        </div>

        <div>
          <Label>Clarity: {enhancementParams.clarity}%</Label>
          <Slider
            value={[enhancementParams.clarity]}
            onValueChange={(value) => handleParamChange("clarity", value[0])}
            max={100}
            step={1}
            disabled={isLoading}
            className="mt-2"
          />
        </div>

        <div>
          <Label>Sharpness: {enhancementParams.sharpness.toFixed(2)}</Label>
          <Slider
            value={[enhancementParams.sharpness]}
            onValueChange={(value) => handleParamChange("sharpness", value[0])}
            min={0}
            max={1}
            step={0.05}
            disabled={isLoading}
            className="mt-2"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={enhancementParams.matchColor}
            onCheckedChange={(checked) => handleParamChange("matchColor", checked)}
            disabled={isLoading}
          />
          <Label>Match Color</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Button onClick={onEnhance} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Wand2 className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Enhance
            </>
          )}
        </Button>

        {outputImageUrl && (
          <Button variant="outline" className="w-full" asChild>
            <a href={outputImageUrl} download={`viralizer_enhanced_${Date.now()}.png`}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
