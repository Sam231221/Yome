import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { options } from "../[...nextauth]/options";

export async function GET() {
  const session = await getServerSession(options);
  return NextResponse.json(session ?? {});
}
