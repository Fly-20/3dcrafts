export const runtime = "nodejs";

const maxFileSize = 10 * 1024 * 1024;
const allowedExtensions = new Set(["stl", "step", "stp", "svg", "png", "jpg", "jpeg", "webp", "pdf"]);

function field(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function shortText(value: string, limit: number) {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = field(formData, "name");
  const email = field(formData, "email");
  const service = field(formData, "service");
  const description = field(formData, "description");
  const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);

  if (![name, email, service, description].every(Boolean)) {
    return Response.json({ message: "Please complete all required fields." }, { status: 400 });
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
  if (files.some((file) => file.size > maxFileSize || !allowedExtensions.has(file.name.split(".").pop()?.toLowerCase() || ""))) {
    return Response.json({ message: "Files must be STL, STEP, SVG, PDF or image files, up to 10 MB each." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!apiKey || !discordWebhookUrl) return Response.json({ message: "Quote submissions are not configured yet. Please email hello@3dcrafts.uk." }, { status: 503 });

  const attachments = await Promise.all(files.map(async (file) => ({ filename: file.name, content: Buffer.from(await file.arrayBuffer()).toString("base64") })));
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Service: ${service}`,
    "",
    "Project description:",
    description,
  ].join("\n");

  const emailRequest = fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.QUOTE_FROM_EMAIL || "3DCRAFTS Quotes <onboarding@resend.dev>",
      to: process.env.QUOTE_TO_EMAIL || "hello@3dcrafts.uk",
      reply_to: email,
      subject: `Quote request from ${name}`,
      text,
      attachments,
    }),
  });

  const discordForm = new FormData();
  discordForm.set("payload_json", JSON.stringify({
    username: "3DCRAFTS Quotes",
    allowed_mentions: { parse: [] },
    embeds: [{
      title: "New quote request",
      color: 16745216,
      description: shortText(description, 1024),
      fields: [
        { name: "Name", value: shortText(name, 1024), inline: true },
        { name: "Email", value: shortText(email, 1024), inline: true },
        { name: "Service", value: shortText(service, 1024), inline: true },
      ],
      footer: { text: files.length ? `${files.length} file(s) attached` : "No files attached" },
    }],
  }));
  files.forEach((file, index) => discordForm.append(`files[${index}]`, file, file.name));

  const discordRequest = fetch(`${discordWebhookUrl}?wait=true`, { method: "POST", body: discordForm });
  const [emailResult, discordResult] = await Promise.allSettled([emailRequest, discordRequest]);
  const emailSent = emailResult.status === "fulfilled" && emailResult.value.ok;
  const discordSent = discordResult.status === "fulfilled" && discordResult.value.ok;

  if (!emailSent) console.error("Quote email delivery failed.");
  if (!discordSent) console.error("Quote Discord notification failed.");
  if (!emailSent && !discordSent) return Response.json({ message: "We couldn't send your request. Please email hello@3dcrafts.uk." }, { status: 502 });

  return Response.json({ message: "Quote request sent." });
}
