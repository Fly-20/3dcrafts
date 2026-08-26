export const runtime = "nodejs";

const maxFileSize = 10 * 1024 * 1024;
const allowedExtensions = new Set(["stl", "step", "stp", "svg", "png", "jpg", "jpeg", "webp", "pdf"]);

function field(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = field(formData, "name");
  const email = field(formData, "email");
  const service = field(formData, "service");
  const description = field(formData, "description");
  const quantity = field(formData, "quantity");
  const dimensions = field(formData, "dimensions");
  const deadline = field(formData, "deadline");
  const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);

  if (![name, email, service, description, quantity, dimensions, deadline].every(Boolean)) {
    return Response.json({ message: "Please complete all required fields." }, { status: 400 });
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
  if (files.some((file) => file.size > maxFileSize || !allowedExtensions.has(file.name.split(".").pop()?.toLowerCase() || ""))) {
    return Response.json({ message: "Files must be STL, STEP, SVG, PDF or image files, up to 10 MB each." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return Response.json({ message: "Quote submissions are not configured yet. Please email hello@3dcrafts.uk." }, { status: 503 });

  const attachments = await Promise.all(files.map(async (file) => ({ filename: file.name, content: Buffer.from(await file.arrayBuffer()).toString("base64") })));
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Service: ${service}`,
    `Quantity: ${quantity}`,
    `Approximate dimensions: ${dimensions}`,
    `Deadline: ${deadline}`,
    "",
    "Project description:",
    description,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
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

  if (!response.ok) return Response.json({ message: "We couldn't send your request. Please email hello@3dcrafts.uk." }, { status: 502 });
  return Response.json({ message: "Quote request sent." });
}
