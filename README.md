# Job Helper

Job Helper reads your resume and a job posting, then helps you tailor your resume for that specific job. It's built for anyone in the middle of a job search, technical or not.

You can use it with:

- **Claude** (Anthropic's AI): best results, needs an API key, costs a few cents per use.
- **A free local model** through **LM Studio** or **Ollama**: runs entirely on your own computer, so your resume never leaves it.

> **Status:** early. Right now you can add your resume (PDF, Word, or text), your background, and a job posting, and connect a model. Resume tailoring and suggestions are next.

## Run it on your computer

You'll do this once. It takes about 10 minutes.

### 1. Install Node.js

Node.js is the free program that runs Job Helper.

1. Go to [nodejs.org](https://nodejs.org) and download the version marked **LTS**.
2. Open the file you downloaded and click through the installer with the default options.

### 2. Download Job Helper

1. On this page, click the green **Code** button, then **Download ZIP**.
2. Unzip it somewhere easy to find, like your Desktop.

(If you use git, `git clone https://github.com/czinabu/job-helper.git` works too.)

### 3. Start it

1. Open a terminal:
   - **Windows:** open the unzipped `job-helper` folder, click the address bar at the top, type `cmd`, and press Enter.
   - **Mac:** open the Terminal app, type `cd ` (with a space after it), drag the `job-helper` folder into the window, and press Enter.
2. Type this and press Enter. It downloads what Job Helper needs, and only has to be done the first time:

   ```
   npm install
   ```

3. Then type this and press Enter:

   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

Leave the terminal window open while you use Job Helper. To stop it, close the window or press `Ctrl + C`. Next time, just open a terminal in the folder again and run `npm run dev`.

### 4. Pick a model

In Job Helper, click **Model settings** at the top right.

- **To use Claude:** choose Claude, paste an API key from [console.anthropic.com](https://console.anthropic.com), and click **Test connection**.
- **To use a free local model:** follow the [local model setup guide](docs/local-models.md), then choose LM Studio or Ollama and click **Test connection**.

If something isn't set up right, the test tells you what to fix in plain English.

## Privacy

- Your resume, background, and settings are saved only in your own browser.
- Uploaded files are read and then thrown away. Nothing is stored on a server.
- With LM Studio or Ollama, your resume is never sent over the internet.
- With Claude, your resume is sent to Anthropic's API to generate results.

## For developers

Next.js (App Router) + TypeScript + Tailwind.

```
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

To host it for others with a shared Claude key, copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`. Visitors can still bring their own key. Local models only work when the app runs on the same computer as LM Studio or Ollama, because the server connects to `localhost`.

Key files:

- `src/lib/providers.ts`: the three providers and their defaults.
- `src/lib/llm.ts`: one `complete()` function that works with Claude and with OpenAI-compatible local servers, plus friendly error messages.
- `src/app/api/test-connection`: checks a provider and lists its models.
- `src/app/api/parse-resume`: turns a PDF or Word resume into text.
