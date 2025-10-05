import { builder } from "~/src/graphql/builder";
import { z } from "zod";

export const summarizeInputSchema = z.object({
  text: z.string().min(1, "text is required"),
  postId: z.string().optional(),
});

export const SummarizeInput = builder.zodInputType({
  name: "SummarizeInput",
  description: "Input for summarizing text",
  schema: summarizeInputSchema,
});


