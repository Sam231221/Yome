import { NextRequest } from "next/server";
import { proxyDevDbMutation } from "../_lib/devDbProxy";

export async function POST(req: NextRequest) {
  return proxyDevDbMutation(req, "create-multiple-groups");
}
