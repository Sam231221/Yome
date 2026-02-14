import crypto from "node:crypto";

function makeRandomIv(): string {
  const str = "0123456789abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 16; i++) {
    result += str.charAt(Math.floor(Math.random() * str.length));
  }
  return result;
}

function getAlgorithm(key: Buffer): string {
  switch (key.length) {
    case 16:
      return "aes-128-cbc";
    case 24:
      return "aes-192-cbc";
    case 32:
      return "aes-256-cbc";
    default:
      throw new Error("Invalid key length: " + key.length);
  }
}

function aesEncrypt(plainText: string, key: Buffer, iv: string): ArrayBuffer {
  const cipher = crypto.createCipheriv(getAlgorithm(key), key, Buffer.from(iv, "utf8"));
  cipher.setAutoPadding(true);
  const encrypted = cipher.update(plainText, "utf8");
  const final = cipher.final();
  return Buffer.concat([encrypted, final]).buffer;
}

/**
 * Generate Zego token for video/voice (token04 format).
 */
export function generateToken04(
  appId: number,
  userId: string,
  secret: string,
  effectiveTimeInSeconds: number,
  payload: string
): string {
  if (!appId || typeof appId !== "number") {
    throw new Error("appID invalid");
  }
  if (!userId || typeof userId !== "string") {
    throw new Error("userId invalid");
  }
  if (!secret || typeof secret !== "string" || secret.length !== 32) {
    throw new Error("secret must be a 32 byte string");
  }
  if (typeof effectiveTimeInSeconds !== "number") {
    throw new Error("effectiveTimeInSeconds invalid");
  }

  const key = Buffer.from(secret, "utf8");
  const createTime = Math.floor(Date.now() / 1000);
  const tokenInfo = {
    app_id: appId,
    user_id: userId,
    nonce: Math.ceil(-2147483648 + (2147483647 - -2147483648) * Math.random()),
    ctime: createTime,
    expire: createTime + effectiveTimeInSeconds,
    payload: payload || "",
  };

  const plainText = JSON.stringify(tokenInfo);
  const iv = makeRandomIv();
  const encryptBuf = aesEncrypt(plainText, key, iv);

  const b1 = new Uint8Array(8);
  const b2 = new Uint8Array(2);
  const b3 = new Uint8Array(2);
  new DataView(b1.buffer).setBigInt64(0, BigInt(tokenInfo.expire), false);
  new DataView(b2.buffer).setUint16(0, iv.length, false);
  new DataView(b3.buffer).setUint16(0, encryptBuf.byteLength, false);

  const buf = Buffer.concat([
    Buffer.from(b1),
    Buffer.from(b2),
    Buffer.from(iv, "utf8"),
    Buffer.from(b3),
    Buffer.from(encryptBuf),
  ]);
  return "04" + buf.toString("base64");
}
