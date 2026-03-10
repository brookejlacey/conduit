import Anthropic from '@anthropic-ai/sdk';
import type { Logger } from 'pino';

export interface ClaudeAnalysisResponse {
  shouldAct: boolean;
  reasoning: string;
  confidence: number;
  action?: {
    type: string;
    target: string;
    amount: number;
    direction: string;
  };
}

export class ClaudeClient {
  private client: Anthropic;

  constructor(
    apiKey: string,
    private logger: Logger,
  ) {
    this.client = new Anthropic({ apiKey });
  }

  async analyze(systemPrompt: string, userPrompt: string): Promise<ClaudeAnalysisResponse> {
    this.logger.debug('Sending analysis request to Claude...');

    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const textContent = message.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      const parsed = this.parseStructuredResponse(textContent.text);
      this.logger.debug(
        { shouldAct: parsed.shouldAct, confidence: parsed.confidence },
        'Claude analysis complete',
      );

      return parsed;
    } catch (err) {
      this.logger.error({ err }, 'Claude API call failed');
      return {
        shouldAct: false,
        reasoning: 'Analysis failed due to API error. Defaulting to no action.',
        confidence: 0,
      };
    }
  }

  private parseStructuredResponse(text: string): ClaudeAnalysisResponse {
    // Attempt to parse JSON from Claude's response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          shouldAct: Boolean(parsed.shouldAct ?? parsed.should_act ?? false),
          reasoning: String(parsed.reasoning ?? parsed.explanation ?? text),
          confidence: Number(parsed.confidence ?? 0.5),
          action: parsed.action
            ? {
                type: String(parsed.action.type ?? ''),
                target: String(parsed.action.target ?? ''),
                amount: Number(parsed.action.amount ?? 0),
                direction: String(parsed.action.direction ?? ''),
              }
            : undefined,
        };
      } catch {
        // Fall through to text parsing
      }
    }

    // Fallback: parse from natural language
    const shouldAct =
      text.toLowerCase().includes('recommend') || text.toLowerCase().includes('should proceed');
    return {
      shouldAct,
      reasoning: text,
      confidence: shouldAct ? 0.6 : 0.4,
    };
  }
}
