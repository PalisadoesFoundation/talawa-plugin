import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import { z } from "zod";
import { SummarizeResultRef } from "./types";
import { SummarizeInput, summarizeInputSchema } from "./inputs";

const summarizeArgsSchema = z.object({
  input: summarizeInputSchema,
});

export async function summarizeTextResolver(
  _parent: unknown,
  args: z.infer<typeof summarizeArgsSchema>,
  _ctx: GraphQLContext
) {
  const { success, data, error } = summarizeArgsSchema.safeParse(args);
  if (!success) {
    throw new Error(
      `invalid_arguments: ${error.issues.map((i) => i.message).join(", ")}`
    );
  }

  const words = data.input.text.trim().split(/\s+/);
  const summary = words.length <= 10 ? data.input.text.trim() : words.slice(0, 10).join(" ") + "...";

  return {
    summary,
    originalLength: data.input.text.length,
    summaryLength: summary.length,
    postId: data.input.postId ?? null,
  };
}

export function registerSummarizeMutations(b: typeof builder) {
  b.mutationField("summarizeText", (t) =>
    t.field({
      type: SummarizeResultRef,
      args: {
        input: t.arg({ type: SummarizeInput, required: true }),
      },
      description: "Summarize text to ~10 words (demo)",
      resolve: summarizeTextResolver,
    })
  );
}


