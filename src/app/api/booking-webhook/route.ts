import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const webhookUrl = process.env.N8N_BOOKING_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      { ok: false, error: "Booking automation is not configured." },
      { status: 503 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { ok: false, error: "Invalid booking payload." },
      { status: 400 }
    );
  }

  const payload = body as Record<string, unknown>;

  const requiredFields = [
    "full_name",
    "phone",
    "service",
    "appointment_date",
    "appointment_time",
  ];

  const missingField = requiredFields.find(
    (field) =>
      typeof payload[field] !== "string" ||
      !(payload[field] as string).trim()
  );

  if (missingField) {
    return NextResponse.json(
      { ok: false, error: `Missing required field: ${missingField}` },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: (payload.full_name as string).trim(),
        phone: (payload.phone as string).trim(),
        email:
          typeof payload.email === "string"
            ? payload.email.trim()
            : "",
        service: (payload.service as string).trim(),
        appointment_date: payload.appointment_date,
        appointment_time: payload.appointment_time,
        ...(typeof payload.notes === "string" &&
        payload.notes.trim()
          ? { notes: payload.notes.trim() }
          : {}),
        ...(typeof payload.booking_id === "string" &&
        payload.booking_id.trim()
          ? { booking_id: payload.booking_id.trim() }
          : {}),
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "n8n booking webhook rejected request:",
        response.status
      );

      return NextResponse.json(
        { ok: false, error: "Booking automation webhook failed." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("n8n booking webhook request failed:", error);

    return NextResponse.json(
      { ok: false, error: "Unable to reach booking automation webhook." },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
