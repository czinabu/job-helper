# Use a free local model

A local model runs on your own computer instead of on the internet. It's free, and your resume never leaves your machine. The tradeoff is that results are usually less polished than Claude's, and your computer needs enough memory.

**Pick one of the two options below.** If you're not sure, choose **LM Studio**: it's a normal app with buttons, so there's no typing commands.

> **Use Chrome, Edge, or Firefox.** The Job Helper website talks to the model on your computer directly from your browser. Safari may block this. The first time you click Test connection, your browser may ask whether the site can **access devices on your local network**. Click **Allow**: that's how it reaches LM Studio or Ollama.

## Which model should I download?

It depends on how much memory (RAM) your computer has.

- **Find your RAM:** on Windows, open Settings → System → About and look at "Installed RAM". On a Mac, click the Apple menu → About This Mac and look at "Memory".

| Your RAM | Recommended model | Download size |
| --- | --- | --- |
| 8 GB | Qwen3 4B | about 2.5 GB |
| 16 GB | Qwen3 8B | about 5 GB |
| 32 GB or more | Qwen3 14B | about 9 GB |

Any similar chat model works (for example Gemma 3 or Llama 3). Bigger models give better results but run slower.

---

## Option A: LM Studio (recommended for most people)

### 1. Install LM Studio

1. Go to [lmstudio.ai](https://lmstudio.ai) and click the download button for your computer.
2. Open the file and install it like any other app.
3. Open LM Studio. If it asks you to download a starter model, you can skip that and follow step 2 instead.

### 2. Download a model

1. Click the **Discover** tab (the magnifying glass on the left side).
2. Search for the model from the table above, for example `qwen3 8b`.
3. Click **Download** and wait for it to finish.

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
2. Type the command for your model from the table above and press Enter:

   | Model | Command |
   | --- | --- |
   | Qwen3 4B | `ollama pull qwen3:4b` |
   | Qwen3 8B | `ollama pull qwen3:8b` |
   | Qwen3 14B | `ollama pull qwen3:14b` |

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
Try a smaller model from the table. Closing other big apps (like games or many browser tabs) also helps.

**Results are low quality**
Try a bigger model if your computer has the memory for it, or switch to Claude in Model settings.
