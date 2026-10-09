import {
  createEmptyShoppingRecordDraft,
  type ShoppingRecordDraft,
} from "@/lib/companion/types";
import { DEFAULT_QUANTITY, parseQuantity } from "@/lib/quantity";
import type { ExplicitLlmFields } from "@/lib/providers/gemini/llm";

/**
 * Draft boundary for an already validated LLM extraction.
 * Missing quantity uses the existing draft default. Missing price stays null.
 */
export function shoppingRecordDraftFromLlmFields(
  fields: ExplicitLlmFields,
  options: {
    sourceText: string;
    tripId: string | null;
    tripLabel: string | null;
  },
): ShoppingRecordDraft {
  const draft = createEmptyShoppingRecordDraft({
    sourceText: options.sourceText,
    tripId: options.tripId,
    tripLabel: options.tripLabel,
    purchaseDateDefault: null,
  });
  return {
    ...draft,
    name: fields.product_name ?? "",
    price: fields.price,
    currency: fields.currency,
    location: fields.location ?? "",
    purchaseDate: fields.purchase_date,
    quantity: parseQuantity(fields.quantity) ?? DEFAULT_QUANTITY,
  };
}
