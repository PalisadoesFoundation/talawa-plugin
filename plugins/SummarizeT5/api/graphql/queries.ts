import { builder } from "~/src/graphql/builder";

builder.queryField("summarizeT5Health", (t) =>
  t.field({
    type: "String",
    description: "Health status for SummarizeT5 plugin",
    resolve: () => "ok",
  })
);


