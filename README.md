# Job Helper

Job Helper reads your resume and a job posting, then helps you tailor your resume for that specific job. It's built for anyone in the middle of a job search, technical or not.

You can use it with:

- **Claude** (Anthropic's AI): best results, nothing to install.
- **A free local model** through **LM Studio** or **Ollama**: runs on your own computer, so your resume never leaves it.

> **Status:** early. Right now you can add your resume (PDF, Word, or text), your background, and a job posting, and connect a model. Resume tailoring and suggestions are next.

## Using Job Helper

1. Open the Job Helper website in your browser. There's nothing to install.
2. Click **Model settings** at the top right and pick where the AI runs:
   - **Claude:** paste an API key from [console.anthropic.com](https://console.anthropic.com) (everyone uses their own key, billed to their own Anthropic account), then click **Test connection**.
   - **LM Studio or Ollama:** follow the [local model setup guide](docs/local-models.md) first, then click **Test connection**.
3. Go back to the home page and add your resume and the job posting.

If something isn't set up right, Test connection tells you what to fix in plain English.

## Privacy

- Your resume, background, and settings are saved only in your own browser.
- Resume files are read inside your browser. They're never uploaded.
- With LM Studio or Ollama, your browser talks straight to the model on your computer. Your resume is never sent over the internet.
- With Claude, your resume goes through the Job Helper server to Anthropic's API to generate results. Nothing is stored.

## How Claude models are used

Claude has two model settings so the expensive model is only used when it's worth it:

- **Model for big jobs** (default: Claude Opus): demanding work like rewriting your whole resume.
- **Model for quick jobs** (default: Claude Sonnet): lighter work like short suggestions.

Local models use the one model you pick for everything.

## Host your own copy on Vercel

1. Sign in to [vercel.com](https://vercel.com) with GitHub and click **Add New → Project**.
2. Import this repository. Vercel detects Next.js, so keep the default settings.
3. Click **Deploy**. No environment variables are needed: visitors paste their own Claude API key in Model settings, so you never pay for their usage.

## For developers

Next.js (App Router) + TypeScript + Tailwind.

```
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

No environment variables are needed. Claude requests always use the API key entered in Model settings.

How it fits together:

- `src/lib/tasks.ts`: every AI request is a *task* with a prompt, input and output schemas, and a weight (`heavy` or `light`). Features register their task in `TASKS`.
- `src/lib/ai.ts`: what the UI calls. Runs a task on the picked model.
- `src/lib/local.ts`: runs tasks on LM Studio or Ollama **from the browser**, so the hosted site can use a visitor's local model.
- `src/lib/claude.ts` and `src/app/api/task`: run tasks on Claude **on the server**. Heavy tasks use the main model, light ones the quick model.
- `src/lib/parseResume.ts`: reads PDF and Word files in the browser.
