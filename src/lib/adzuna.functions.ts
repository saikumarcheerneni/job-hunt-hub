import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { searchAdzunaJobs } from "./adzuna.server";

const schema = z.object({
  keyword: z.string().trim().max(100).default(""),
  location: z.string().trim().max(100).default(""),
});

export const searchJobs = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => searchAdzunaJobs(data));
