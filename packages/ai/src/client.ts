import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
}

export async function generateWithClaude(
  prompt: string,
  maxTokens: number = 1000
): Promise<AIResponse> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return {
        content: content.text,
        success: true,
      };
    }

    return {
      content: '',
      success: false,
      error: 'Unexpected response type from Claude',
    };
  } catch (error) {
    return {
      content: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function* streamWithClaude(
  prompt: string,
  maxTokens: number = 1000
): AsyncGenerator<string, void, unknown> {
  try {
    const stream = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: true,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  } catch (error) {
    console.error('Streaming error:', error);
    throw error;
  }
}
