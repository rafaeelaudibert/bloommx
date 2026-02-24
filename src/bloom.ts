// Minimal bloom filter runtime — test-only path ported from bloomfilter@1.0.0
// https://github.com/jasondavies/bloomfilter.js (BSD-3-Clause)

function decodeBuckets(base64: string): Uint32Array {
  const binary = typeof Buffer !== "undefined"
    ? Buffer.from(base64, "base64")
    : Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Uint32Array(binary.buffer, binary.byteOffset, binary.byteLength / 4);
}

function fnv1a(v: string): [number, number] {
  const prime = 0x01b3;
  const len = v.length;
  let t0: number, t1: number, t2: number, t3: number;
  let v0 = 0x2325, v1 = 0x8422, v2 = 0x9ce4, v3 = 0xcbf2;

  for (let i = 0; i < len; ++i) {
    v0 ^= v.charCodeAt(i);
    t0 = v0 * prime;
    t1 = v1 * prime;
    t2 = v2 * prime;
    t3 = v3 * prime;
    t2 += v0 << 8;
    t3 += v1 << 8;
    t1 += t0 >>> 16;
    v0 = t0 & 0xffff;
    t2 += t1 >>> 16;
    v1 = t1 & 0xffff;
    v3 = (t3 + (t2 >>> 16)) & 0xffff;
    v2 = t2 & 0xffff;
  }

  return [(v3 << 16) | v2, (v1 << 16) | v0];
}

function test(buckets: Uint32Array, m: number, k: number, value: string): boolean {
  let [a, b] = fnv1a(value);
  a = a % m;
  if (a < 0) a += m;
  b = b % m;
  if (b < 0) b += m;

  if ((buckets[a >> 5] & (1 << (a & 0x1f))) === 0) return false;
  for (let i = 1; i < k; ++i) {
    a = (a + b) % m;
    b = (b + i) % m;
    if ((buckets[a >> 5] & (1 << (a & 0x1f))) === 0) return false;
  }
  return true;
}

export type Checker = (domain: string) => boolean;

export function createChecker(data: string, m: number, k: number): Checker {
  const buckets = decodeBuckets(data);
  return (domain: string) => test(buckets, m, k, domain);
}

export function checkEmail(checker: Checker, email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 1) return false;
  const domain = email.slice(at + 1).toLowerCase().trim();
  if (!domain) return false;
  return checker(domain);
}
