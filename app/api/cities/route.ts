import { NextRequest, NextResponse } from "next/server";
import { getAllCities, addCity, deleteCity } from "@/lib/bridges";

export async function GET() {
  const cities = await getAllCities();
  return NextResponse.json(cities);
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "City name is required" }, { status: 400 });
    }
    const city = await addCity(name.trim());
    return NextResponse.json(city);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { slug } = await request.json();
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "City slug is required" }, { status: 400 });
    }
    const deleted = await deleteCity(slug);
    if (!deleted) {
      return NextResponse.json({ error: "City not found or cannot be deleted" }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
