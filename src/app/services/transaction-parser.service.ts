import { Injectable, inject } from '@angular/core';
import { VertexAI, getGenerativeModel } from '@angular/fire/vertexai';
import { DateTime } from 'luxon';
import {
  ParsedTransactionData,
  ParserContext,
} from '../models/voice-input.model';

@Injectable({
  providedIn: 'root',
})
export class TransactionParserService {
  private vertexAI = inject(VertexAI);

  async parseAudio(
    audioBlob: Blob,
    context: ParserContext,
  ): Promise<ParsedTransactionData> {
    const model = getGenerativeModel(this.vertexAI, {
      model: 'gemini-2.0-flash',
    });

    // Convert audio blob to base64
    const base64Audio = await this.blobToBase64(audioBlob);
    const mimeType = audioBlob.type || 'audio/webm';

    const prompt = this.buildPrompt(context);

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Audio,
        },
      },
      { text: prompt },
    ]);

    const response = result.response.text();
    return this.parseResponse(response, context);
  }

  async parseText(
    text: string,
    context: ParserContext,
  ): Promise<ParsedTransactionData> {
    const model = getGenerativeModel(this.vertexAI, {
      model: 'gemini-2.0-flash',
    });

    const prompt = this.buildTextPrompt(text, context);

    const result = await model.generateContent(prompt);

    const response = result.response.text();
    return this.parseResponse(response, context);
  }

  private buildPrompt(context: ParserContext): string {
    return `You are a transaction parser for an expense tracking app. Listen to the audio and extract transaction information.

${this.buildContextSection(context)}

${this.buildInstructionsSection()}

${this.buildResponseFormat('<what the user said>')}`;
  }

  private buildTextPrompt(text: string, context: ParserContext): string {
    return `You are a transaction parser for an expense tracking app. Parse the user's text input and extract transaction information.

USER INPUT: "${text}"

${this.buildContextSection(context)}

${this.buildInstructionsSection()}

${this.buildResponseFormat(text)}`;
  }

  private buildContextSection(context: ParserContext): string {
    const today = DateTime.now().toISODate();

    const categoryList = context.categories
      .map((c) => `- "${c.name}" (${c.type}, ID: ${c.id})`)
      .join('\n');

    const accountList = context.accounts
      .map((a) => `- "${a.name}" (ID: ${a.id})`)
      .join('\n');

    return `TODAY'S DATE: ${today}

AVAILABLE CATEGORIES:
${categoryList}

AVAILABLE ACCOUNTS:
${accountList}

DEFAULT ACCOUNT ID: ${
      context.defaultAccountId || context.accounts[0]?.id || ''
    }`;
  }

  private buildInstructionsSection(): string {
    return `INSTRUCTIONS:
Extract transaction data:
- amount: The monetary amount (required)
- categoryId: REQUIRED - Match to the BEST fitting category using semantic understanding:
  * "lobster", "lunch", "coffee", "restaurant" → Food/Dining category
  * "uber", "taxi", "bus", "gas" → Transportation category
  * "movie", "concert", "game" → Entertainment category
  * Use common sense to match items to categories even if not explicitly mentioned
- accountId: If mentioned, match to an account; otherwise use default
- date: If mentioned (today, yesterday, last Friday, etc.), calculate the date; otherwise use today
- note: Brief description of the transaction (e.g., "lobster dinner")
- transactionType: "expense" if spending money, "income" if receiving money`;
  }

  private buildResponseFormat(transcript: string): string {
    return `Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "rawTranscript": "${transcript}",
  "amount": <number or null>,
  "categoryId": "<string or null>",
  "categoryName": "<matched category name or null>",
  "accountId": "<string or null>",
  "accountName": "<matched account name or null>",
  "date": "<YYYY-MM-DD>",
  "note": "<string>",
  "transactionType": "<expense|income>"
}`;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private parseResponse(
    response: string,
    context: ParserContext,
  ): ParsedTransactionData {
    try {
      // Clean up response - remove markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse
          .replace(/^```json?\n?/, '')
          .replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(cleanResponse);

      return {
        amount: parsed.amount ?? null,
        categoryId: parsed.categoryId ?? null,
        categoryName: parsed.categoryName ?? null,
        accountId: parsed.accountId ?? context.defaultAccountId ?? null,
        accountName: parsed.accountName ?? null,
        date: parsed.date
          ? DateTime.fromISO(parsed.date).toJSDate()
          : DateTime.now().toJSDate(),
        note: parsed.note ?? '',
        transactionType: parsed.transactionType ?? 'expense',
        rawTranscript: parsed.rawTranscript ?? '',
      };
    } catch (error) {
      console.error('Failed to parse AI response:', response, error);

      // Return a fallback result
      return {
        amount: null,
        categoryId: null,
        categoryName: null,
        accountId: context.defaultAccountId ?? null,
        accountName: null,
        date: DateTime.now().toJSDate(),
        note: response, // Put the raw response as note for debugging
        transactionType: 'expense',
        rawTranscript: 'Failed to parse audio',
      };
    }
  }
}
