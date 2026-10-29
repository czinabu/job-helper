import type { z } from "zod";
import type { TaskWeight } from "./providers";

/**
 * One kind of AI request the app makes, like "tailor a resume". Tasks are
 * shared by the browser (which runs them on local models) and the server
 * (which runs them on Claude), so prompts live in one place.
 */
export interface Task<Input, Output> {
  /** Heavy tasks run on the main Claude model (Opus), light ones on the quick model. */
  weight: TaskWeight;
  system: string;
  user: (input: Input) => string;
  /** Checks the input before anything is sent. */
  input: z.ZodType<Input>;
  /** The shape the model must reply in. */
  output: z.ZodType<Output>;
}

export function defineTask<Input, Output>(task: Task<Input, Output>) {
  return task;
}

/**
 * Every task the app can run, by name. Features add their task here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TASKS: Record<string, Task<any, any>> = {};

export type TaskName = keyof typeof TASKS;
