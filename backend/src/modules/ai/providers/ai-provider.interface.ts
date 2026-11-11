// src/modules/ai/providers/ai-provider.interface.ts

export interface GenerateTextInput {
  system: string;
  prompt: string;
  maxOutputTokens?: number;
}

export interface GenerateTextResult {
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

export interface AiProvider {
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;
}