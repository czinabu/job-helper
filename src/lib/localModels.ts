// Which local model to download, by the kind of computer the visitor has.
// Keep this in sync with the table in docs/local-models.md.

export interface ComputerType {
  id: string;
  /** How the visitor would describe their computer. */
  label: string;
  model: string;
  /** What to run in a terminal for Ollama. */
  ollamaTag: string;
  /** What to type in LM Studio's Discover search. */
  lmStudioSearch: string;
  downloadSize: string;
  /** Rough time to rewrite a one-page resume. */
  rewriteTime: string;
  quality: string;
}

export const COMPUTER_TYPES: ComputerType[] = [
  {
    id: "ram8",
    label: "Any computer with 8 GB of memory",
    model: "Qwen3.5 4B",
    ollamaTag: "qwen3.5:4b",
    lmStudioSearch: "qwen3.5 4b",
    downloadSize: "about 3.5 GB",
    rewriteTime: "1 to 2 minutes on a Mac, 2 to 5 minutes on other laptops",
    quality:
      "Fine for short suggestions. Full rewrites are noticeably weaker than Claude's, and it may sometimes need a second try.",
  },
  {
    id: "mac16",
    label: "Mac (M1 or newer) with 16 to 24 GB",
    model: "Gemma 4 12B",
    ollamaTag: "gemma4:12b",
    lmStudioSearch: "gemma 4 12b",
    downloadSize: "about 8 GB",
    rewriteTime: "about 1 minute",
    quality: "Solid everyday results. Writing is plainer than Claude's, so read it over before you send it.",
  },
  {
    id: "mac32",
    label: "Mac (M1 or newer) with 32 GB",
    model: "Gemma 4 26B",
    ollamaTag: "gemma4:26b",
    lmStudioSearch: "gemma 4 26b",
    downloadSize: "about 18 GB",
    rewriteTime: "under a minute",
    quality: "Good results and fast. Still a step below Claude on careful, polished rewrites.",
  },
  {
    id: "mac48",
    label: "Mac (M1 or newer) with 48 GB or more",
    model: "Gemma 4 31B",
    ollamaTag: "gemma4:31b",
    lmStudioSearch: "gemma 4 31b",
    downloadSize: "about 20 GB",
    rewriteTime: "1 to 2 minutes",
    quality: "The best local quality, though still a step below Claude on polish. Worth a careful read.",
  },
  {
    id: "pc16",
    label: "Windows or Linux PC with 16 GB, no NVIDIA graphics card",
    model: "Gemma 4 E4B",
    ollamaTag: "gemma4:e4b",
    lmStudioSearch: "gemma 4 e4b",
    downloadSize: "about 7 GB",
    rewriteTime: "2 to 4 minutes",
    quality:
      "Decent for suggestions and drafts. Full rewrites are noticeably weaker than Claude's.",
  },
  {
    id: "pc32",
    label: "Windows or Linux PC with 32 GB or more, no NVIDIA graphics card",
    model: "Gemma 4 26B",
    ollamaTag: "gemma4:26b",
    lmStudioSearch: "gemma 4 26b",
    downloadSize: "about 18 GB",
    rewriteTime: "2 to 4 minutes",
    quality: "Good results. Still a step below Claude on careful, polished rewrites.",
  },
  {
    id: "nvidia8",
    label: "PC with an NVIDIA graphics card with 8 GB",
    model: "Qwen3.5 9B",
    ollamaTag: "qwen3.5:9b",
    lmStudioSearch: "qwen3.5 9b",
    downloadSize: "about 7 GB",
    rewriteTime: "under a minute",
    quality: "Solid everyday results. Writing is plainer than Claude's, so read it over before you send it.",
  },
  {
    id: "nvidia12",
    label: "PC with an NVIDIA graphics card with 12 to 16 GB",
    model: "Gemma 4 12B",
    ollamaTag: "gemma4:12b",
    lmStudioSearch: "gemma 4 12b",
    downloadSize: "about 8 GB",
    rewriteTime: "under a minute",
    quality: "Solid everyday results. Writing is plainer than Claude's, so read it over before you send it.",
  },
  {
    id: "nvidia24",
    label: "PC with an NVIDIA graphics card with 24 GB or more",
    model: "Gemma 4 31B",
    ollamaTag: "gemma4:31b",
    lmStudioSearch: "gemma 4 31b",
    downloadSize: "about 20 GB",
    rewriteTime: "under a minute",
    quality: "The best local quality, though still a step below Claude on polish. Worth a careful read.",
  },
];
