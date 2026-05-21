import { supabase } from './supabase';

interface CallAIOptions {
  message: string;
  denomination?: string;
  mode?: string;
  history?: { role: string; content: string }[];
}

/**
 * Shared helper for calling the Gemini AI Edge Function.
 * Centralises the invocation pattern so changes only need to be made in one place.
 */
export async function callAI({ message, denomination = 'Non-Denominational', mode, history = [] }: CallAIOptions): Promise<string> {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: { message, history, denomination, mode },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data?.reply ?? "I am currently unable to reflect on this. Let us pray together in silence.";
}

/**
 * Parse a JSON string from an AI response, stripping any markdown code fences.
 */
export function parseAIJson<T>(raw: string): T {
  const cleaned = raw.startsWith('```')
    ? raw.replace(/^```json\n?/, '').replace(/```$/, '').trim()
    : raw;
  return JSON.parse(cleaned) as T;
}
