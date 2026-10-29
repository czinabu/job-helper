# Job Helper

Job Helper reads your resume and a job posting, then helps you tailor your resume for that specific job. It's built for anyone in the middle of a job search, technical or not.

You can use it with:

- **Claude** (Anthropic's AI): best results, nothing to install.
- **A free local model** through **LM Studio** or **Ollama**: runs on your own computer, so your resume never leaves it.

> **Status:** early. You can add your resume (PDF, Word, or text), your background, and a job posting, then get a tailored resume with a match summary. Suggestions are next.

## Using Job Helper

1. Open the hosted Job Helper website in your browser. There's nothing to install or deploy, and you don't need a Vercel account.
2. Click **Model settings** at the top right and pick where the AI runs:
   - **Claude:** paste an API key from [console.anthropic.com](https://console.anthropic.com) (everyone uses their own key, billed to their own Anthropic account), then click **Test connection**.
   - **LM Studio or Ollama:** follow the [local model setup guide](docs/local-models.md) first, then click **Test connection**.
3. Go back to the home page, add your resume and the job posting, and click **Tailor my resume**. You get a rewritten resume, a match score, the skills you have and are missing, which of the posting's keywords each version contains, and a list of what changed and why.

If something isn't set up right, Test connection tells you what to fix in plain English.

## Privacy

- Your resume, background, and settings are saved only in your own browser.
- Resume files are read inside your browser. They're never uploaded.
- With LM Studio or Ollama, your browser talks straight to the model on your computer. Your resume is never sent over the internet.
- With Claude, your browser sends your resume and API key straight to Anthropic's API. They never pass through the Job Helper server, which stores and logs nothing. The key is kept for the current tab only unless you tick "Remember my key on this device", and "Clear my key" removes it. A Content-Security-Policy (in `next.config.ts`) limits where the page can send data.

## How Claude models are used

Claude has two model settings so the expensive model is only used when it's worth it:

- **Model for big jobs** (default: Claude Opus): demanding work like rewriting your whole resume.
- **Model for quick jobs** (default: Claude Sonnet): lighter work like short suggestions.

Local models use the one model you pick for everything.

## For maintainers: hosting the site on Vercel

Job Helper runs as one public site on Vercel, deployed from this repository. Regular users just open that site. These steps are for whoever runs it (or anyone who wants a private copy).

1. Sign in to [vercel.com](https://vercel.com) with GitHub and click **Add New → Project**.
2. Import this repository. Vercel detects Next.js, so keep the default settings.
3. Click **Deploy**. No environment variables are needed: visitors paste their own Claude API key in Model settings, so the site owner never pays for their usage.
4. Optional: under **Settings → Domains**, add a custom domain.

After that, every merge to `main` redeploys the site automatically, and each pull request gets its own preview link.

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
- `src/lib/claude.ts`: runs tasks on Claude **from the browser** (there are no server API routes). `src/lib/apiKey.ts` and `src/lib/useSettings.ts` keep the key out of the saved settings. Heavy tasks use the main model, light ones the quick model.
- `src/lib/tailor.ts`: the `tailor` task (heavy, so it runs on the main model) and the keyword check. `src/components/TailorResults.tsx` shows the results.
- `src/lib/parseResume.ts`: reads PDF and Word files in the browser.
