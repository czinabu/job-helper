# Use a free local model

A local model runs on your own computer instead of on the internet. It's free, and your resume never leaves your machine. The tradeoff is that results are usually less polished than Claude's, and your computer needs enough memory.

**Pick one of the two options below.** If you're not sure, choose **LM Studio**: it's a normal app with buttons, so there's no typing commands.

> **Use Chrome, Edge, or Firefox.** The Job Helper website talks to the model on your computer directly from your browser. Safari may block this. The first time you click Test connection, your browser may ask whether the site can **access devices on your local network**. Click **Allow**: that's how it reaches LM Studio or Ollama.

## Which model should I download?

*Last checked: October 2026. New models come out often, so these picks will age.*

The right model depends on two things: **how much memory your computer has**, and **whether it has a graphics card that helps** (an Apple Silicon Mac or an NVIDIA graphics card). If it has neither, the model runs on the main processor (CPU), which works but is slower.

**Find your memory and chip:**

- **Mac:** click the Apple menu → **About This Mac**. "Chip" says M1, M2, M3, M4, or M5 for Apple Silicon (an "Intel" Mac counts as a PC without a graphics card). "Memory" is your RAM.
- **Windows:** open Settings → System → About and look at **Installed RAM**. To check for an NVIDIA card, press `Ctrl + Shift + Esc`, open the **Performance** tab, and click **GPU**. If it says NVIDIA, the number next to "Dedicated GPU memory" is what matters.

Then find your computer in this table:

| Your computer | Model | Ollama command | Download | Time to rewrite a resume |
| --- | --- | --- | --- | --- |
| Any computer with 8 GB | Qwen3.5 4B | `ollama pull qwen3.5:4b` | about 3.5 GB | 1 to 2 min on a Mac, 2 to 5 min on other laptops |
| Mac with 16 to 24 GB | Gemma 4 12B | `ollama pull gemma4:12b` | about 8 GB | about 1 min |
| Mac with 32 GB | Gemma 4 26B | `ollama pull gemma4:26b` | about 18 GB | under 1 min |
| Mac with 48 GB or more | Gemma 4 31B | `ollama pull gemma4:31b` | about 20 GB | 1 to 2 min |
| PC with 16 GB, no NVIDIA card | Gemma 4 E4B | `ollama pull gemma4:e4b` | about 7 GB | 2 to 4 min |
| PC with 32 GB or more, no NVIDIA card | Gemma 4 26B | `ollama pull gemma4:26b` | about 18 GB | 2 to 4 min |
| NVIDIA card with 8 GB | Qwen3.5 9B | `ollama pull qwen3.5:9b` | about 7 GB | under 1 min |
| NVIDIA card with 12 to 16 GB | Gemma 4 12B | `ollama pull gemma4:12b` | about 8 GB | under 1 min |
| NVIDIA card with 24 GB or more | Gemma 4 31B | `ollama pull gemma4:31b` | about 20 GB | under 1 min |

Job Helper's **Model settings** page has the same picker: choose **LM Studio** or **Ollama** and look for "Which model fits my computer?".

Times are rough guesses for a one-page resume, and the first run is slower while the model loads. Older or thinner laptops will be at the slow end.

### Why these models

- **Gemma 4** (from Google) is the most reliable family right now at giving answers in the exact format Job Helper needs, and it writes clear English. Most picks are Gemma 4.
- **Qwen3.5** (from Alibaba) has small sizes that squeeze into less memory, so it's the pick for 8 GB computers and 8 GB graphics cards.
- **Gemma 4 26B** is a "mixture of experts" model: it's large, but only a small part of it works on each word, so it's fast even without a graphics card. That makes it the best pick for big-memory PCs without an NVIDIA card.
- **Why not bigger?** A model needs its download size in free memory, plus a few GB to spare. On a Mac, only about two thirds of the memory can be used for the model, which is why a 24 GB Mac stays on the 12B model. If your computer slows to a crawl, step down one row.

### Which version (quantization) to pick

Models come in versions that are squeezed to different sizes. You don't need to choose with Ollama: the commands above download a 4-bit version, which is the best balance of size and quality.

In LM Studio, search for the model name (for example `gemma 4 12b`) and pick the **Q4_K_M** version. On a Mac, LM Studio may also offer an **MLX 4-bit** version: pick that, as it runs faster on Apple Silicon. LM Studio shows a green "Full GPU offload possible" label when a version fits your computer well.

### Have an AMD or Intel graphics card?

LM Studio supports these too. Use the NVIDIA row that matches your card's memory. Results vary more than with NVIDIA, so if it's slow, use the "no NVIDIA card" row instead.

### How good is a local model compared with Claude?

Be ready to edit. Even the biggest model here is a step below Claude at careful, polished rewriting, and the small ones are noticeably weaker: plainer wording, missed details, and sometimes an answer in the wrong format (just try again). Local models can also **make things up**, like a skill or a number that isn't on your resume, so read every line before you send it to an employer. For an important application, it can be worth switching to Claude in Model settings for the final version.

---

## Option A: LM Studio (recommended for most people)

### 1. Install LM Studio

1. Go to [lmstudio.ai](https://lmstudio.ai) and click the download button for your computer.
2. Open the file and install it like any other app.
3. Open LM Studio. If it asks you to download a starter model, you can skip that and follow step 2 instead.

### 2. Download a model

1. Click the **Discover** tab (the magnifying glass on the left side).
2. Search for the model from the table above, for example `gemma 4 12b`.
3. Pick the **Q4_K_M** version (or **MLX 4-bit** on a Mac), click **Download**, and wait for it to finish.
4. When you load the model, LM Studio shows a **Context Length** setting. Set it to at least **8192**, so a resume and a job posting fit at once.

### 3. Turn on the server and allow websites to use it

This is the step people most often miss. Job Helper talks to LM Studio through its built-in server.

1. Click the **Developer** tab on the left side.
2. At the top, flip the **Status** switch so it says **Running**.
3. Open the server **Settings** (next to the Status switch) and turn on **Enable CORS**. This lets the Job Helper website talk to LM Studio.
4. You should see a line like `Reachable at: http://localhost:1234`.

Keep LM Studio open while you use Job Helper.

### 4. Connect Job Helper

1. In Job Helper, click **Model settings**.
2. Choose **LM Studio (local, free)**. Leave the server address as `http://localhost:1234/v1`.
3. Click **Test connection**. You should see "Connected!" and your model in the list.

---

## Option B: Ollama

Ollama is small and runs in the background, but you download models by typing one command.

### 1. Install Ollama

1. Go to [ollama.com](https://ollama.com) and click **Download**.
2. Open the file and install it. On Mac, drag it into Applications and open it once.

After that Ollama runs quietly in the background (look for the llama icon in your menu bar or system tray).

### 2. Download a model

1. Open a terminal:
   - **Windows:** press the Windows key, type `cmd`, and press Enter.
   - **Mac:** open the Terminal app (search for it with Spotlight, `Cmd + Space`).
2. Type the Ollama command for your computer from the table above and press Enter. For example:

   ```
   ollama pull gemma4:12b
   ```

3. Wait for the download to reach 100%. You can close the terminal afterwards.

### 3. Allow the Job Helper website to use Ollama

Ollama only answers websites you've approved, so you need to tell it the Job Helper site's address. The address is the start of what's in your browser's address bar when you're on Job Helper, for example `https://job-helper.vercel.app` (no slash at the end). If you skip this, Test connection shows the exact address to use.

**On Windows:**

1. Click Start, type `environment variables`, and open **Edit environment variables for your account**.
2. Under the top list, click **New...**
3. For **Variable name**, type `OLLAMA_ORIGINS`. For **Variable value**, paste the Job Helper address. Click **OK**, then **OK** again.
4. Quit Ollama (right-click the llama icon near the clock, then **Quit**) and open it again.

**On Mac:**

1. Open Terminal and run this, with your Job Helper address in the quotes:

   ```
   launchctl setenv OLLAMA_ORIGINS "https://job-helper.vercel.app"
   ```

2. Quit Ollama (click the llama icon in the menu bar, then **Quit**) and open it again.

This setting is cleared when your Mac restarts, so run the command again after a restart.

### 4. Connect Job Helper

1. In Job Helper, click **Model settings**.
2. Choose **Ollama (local, free)**. Leave the server address as `http://localhost:11434/v1`.
3. Click **Test connection**. You should see "Connected!" and your model in the list.

---

## Troubleshooting

**"Couldn't reach LM Studio" or "Couldn't reach Ollama"**
Work through the checklist in the message. The usual causes are:
- The app isn't open, or (for LM Studio) the server is off. Check that the Developer tab says **Running**.
- LM Studio's **Enable CORS** setting is off, or Ollama's `OLLAMA_ORIGINS` isn't set to the Job Helper address (or Ollama wasn't restarted after setting it).
- Your browser asked about local network access and it was blocked. In Chrome or Edge, click the icon at the left of the address bar, find **Local network access**, and set it to **Allow**.
- You're on Safari. Try Chrome, Edge, or Firefox.

**"No models are downloaded yet"**
Go back to step 2 for your option and download a model.

**"Answered, but not at that address"**
The server address is slightly off. Use exactly `http://localhost:1234/v1` for LM Studio or `http://localhost:11434/v1` for Ollama.

**Results are very slow**
Try the model one row up in the table (a smaller one). Closing other big apps (like games or many browser tabs) also helps. If your computer freezes or the fan roars while it works, the model is too big for your memory.

**"The local model's answer wasn't in the format Job Helper expected"**
Try again once. If it keeps happening, the model may be running out of room: in LM Studio, raise **Context Length** to 8192 or more when loading the model. In the Ollama app, open Settings and raise the context length if your version has that option. A bigger model also helps.

**Results are low quality**
Try a bigger model if your computer has the memory for it, or switch to Claude in Model settings.
