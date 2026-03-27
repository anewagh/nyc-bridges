import { NextRequest, NextResponse } from "next/server";
import { getBridgesForCity, addBridgeToCity, deleteBridgeFromCity } from "@/lib/bridges";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ citySlug: string }> }
) {
  const { citySlug } = await params;
  const bridges = await getBridgesForCity(citySlug);
  return NextResponse.json(bridges);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ citySlug: string }> }
) {
  try {
    const { citySlug } = await params;
    const body = await request.json();

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Bridge name is required" }, { status: 400 });
    }

    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const bridge = await addBridgeToCity(citySlug, {
      slug,
      name: body.name,
      from: body.from || "",
      to: body.to || "",
      distance: body.distance || "",
      yearBuilt: Number(body.yearBuilt) || 0,
      region: body.region || "General",
      funFacts: body.funFacts || [],
      isUserAdded: true,
      wikipediaUrl: body.wikipediaUrl || undefined,
    });

    return NextResponse.json(bridge);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ citySlug: string }> }
) {
  try {
    const { citySlug } = await params;
    const { bridgeSlug } = await request.json();
    if (!bridgeSlug) {
      return NextResponse.json({ error: "bridgeSlug is required" }, { status: 400 });
    }
    const deleted = await deleteBridgeFromCity(citySlug, bridgeSlug);
    if (!deleted) {
      return NextResponse.json({ error: "Bridge not found or cannot be deleted" }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
