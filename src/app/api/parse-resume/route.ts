import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

const MAX_BYTES = 5 * 1024 * 1024;

// Turns an uploaded resume into plain text. Nothing is saved on the server.
export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That file is over 5 MB. Try exporting a smaller PDF." },
      { status: 400 },
    );
  }

  const name = file.name.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    let text: string;
    if (name.endsWith(".pdf")) {
      const pdf = await getDocumentProxy(bytes);
      ({ text } = await extractText(pdf, { mergePages: true }));
    } else if (name.endsWith(".docx")) {
      ({ value: text } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) }));
    } else if (name.endsWith(".txt") || name.endsWith(".md")) {
      text = new TextDecoder().decode(bytes);
    } else {
      return NextResponse.json(
        { error: "Please upload a PDF, Word (.docx), or text file." },
        { status: 400 },
      );
    }

    text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!text) {
      return NextResponse.json(
        {
          error:
            "No text could be read from that file. If it's a scanned image, paste your resume text instead.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error: "That file couldn't be read. Try another format, or paste the text instead." },
      { status: 400 },
    );
  }
}
