"use server";

import { readGeminiApiKey } from "@/lib/providers/gemini/config";
import { requestGeminiJson } from "@/lib/providers/gemini/call";
import { createClient } from "@/lib/supabase/server";
import { acceptDestinationSuggestion } from "@/lib/workflows/orchestration/control";

const DESTINATION_PROMPT = [
  "Read the user sentence.",
  "Return JSON only: {\"destination\":null}",
  "If the sentence already contains a place name, copy that exact substring into destination.",
  "If it does not, return null.",
  "Do not translate, guess, or add a place that is not written.",
].join(" ");

/**
 * One destination completion. Returns a place only when it is a substring
 * of the current sentence. Never writes business data.
 */
export async function completeExplicitDestination(
  text: string,
): Promise<string | null> {
  const sentence = text.trim();
  if (!sentence) return null;
  const apiKey = readGeminiApiKey();
  if (!apiKey) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const result = await requestGeminiJson({
    apiKey,
    body: {
      contents: [
        {
          role: "user",
          parts: [{ text: `${DESTINATION_PROMPT}\n${sentence}` }],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    },
  });
  if (!result.ok || !result.value || typeof result.value !== "object") return null;
  const destination = (result.value as { destination?: unknown }).destination;
  if (typeof destination !== "string") return null;
  return acceptDestinationSuggestion(sentence, destination);
}
