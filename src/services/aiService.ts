// src/services/aiService.ts
import { GoogleGenAI } from "@google/genai";

// Configuração para ativar/desativar IA no frontend
// Modifique para 'true' apenas quando desejar habilitar com chave de API.
const AI_FEATURES_ENABLED = false;

export class AIService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (AI_FEATURES_ENABLED) {
      this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    }
  }

  async generateResponse(prompt: string, context?: string, retries = 3, delay = 1000): Promise<string | undefined> {
    if (!AI_FEATURES_ENABLED || !this.ai) {
      return "Função de IA desativada temporariamente. Configure a API posteriormente para usar este recurso.";
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: `Você é o Nexus AI, o assistente inteligente do Nexus ERP. 
          Sua função é ajudar os usuários com dúvidas sobre o sistema, análise de dados e automação de tarefas.
          Seja profissional, prestativo e direto.
          
          Contexto do ERP:
          - O sistema possui módulos de Vendas, Estoque, Financeiro, Técnica, Logística, Fiscal e Auditoria.
          - O usuário atual é um Administrador.
          - O sistema está em Português do Brasil.
          
          ${context ? `Contexto Adicional: ${context}` : ''}`,
        },
      });

      return response.text;
    } catch (error: any) {
      console.error("AI Service Error:", error);
      
      // Handle 429 Resource Exhausted / Rate Limit errors with exponential backoff
      if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
        if (retries > 0) {
          console.log(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.generateResponse(prompt, context, retries - 1, delay * 2);
        } else {
          return "O limite de uso da inteligência artificial foi excedido no momento. Por favor, aguarde alguns minutos e tente novamente.";
        }
      }

      return "Desculpe, tive um problema ao processar sua solicitação. Por favor, tente novamente em instantes.";
    }
  }
}

export const aiService = new AIService();

