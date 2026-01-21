import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] || '' });
  }

  async generatePortrait(prompt: string): Promise<string> {
    try {
      const response = await this.ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });
      
      const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (base64ImageBytes) {
        return `data:image/jpeg;base64,${base64ImageBytes}`;
      }
      throw new Error('No image generated');
    } catch (e) {
      console.error('Error generating portrait:', e);
      throw e;
    }
  }

  async analyzeLayout(base64Image: string): Promise<{ namePosition: {x: number, y: number}, idPosition: {x: number, y: number} } | null> {
    try {
      // Clean base64 string if it has prefix
      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64
              }
            },
            {
              text: `Analyze this ID card image. I need to overlay text for a "Name" and an "ID Number". 
              Find the best coordinates (x, y) as percentages (0-100) for where the text values should start.
              Look for labels like "Nombre", "Name", "Nom" for the name field.
              Look for labels like "Identificación", "ID", "Cedula" for the ID field.
              The text should be placed slightly to the right of these labels.
              
              Return JSON matching this schema:
              {
                "namePosition": { "x": number, "y": number },
                "idPosition": { "x": number, "y": number }
              }`
            }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              namePosition: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER, description: "X percentage (0-100)" },
                  y: { type: Type.NUMBER, description: "Y percentage (0-100)" }
                }
              },
              idPosition: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER, description: "X percentage (0-100)" },
                  y: { type: Type.NUMBER, description: "Y percentage (0-100)" }
                }
              }
            }
          }
        }
      });

      const text = response.text;
      if (!text) return null;
      return JSON.parse(text);

    } catch (e) {
      console.error('Error analyzing layout:', e);
      return null;
    }
  }
}
