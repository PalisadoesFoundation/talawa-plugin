import { builder } from "~/src/graphql/builder";

export const SummarizeResultRef = builder.simpleObject("SummarizeResult", {
  fields: (t) => ({
    summary: t.string({}),
    originalLength: t.int({}),
    summaryLength: t.int({}),
    postId: t.string({ nullable: true }),
  }),
});


