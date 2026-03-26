import { NextRequest, NextResponse } from "next/server";
import { getAllCities, addCity } from "@/lib/bridges";

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
