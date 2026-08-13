/** Seeded PRNG for reproducible synthetic Bootcamp scenarios. */

export class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0 || 1;
  }

  next(): number {
    // xorshift32
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 0xffffffff;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)]!;
  }

  bool(p = 0.5): boolean {
    return this.next() < p;
  }

  money(min: number, max: number): number {
    return Math.round((min + this.next() * (max - min)) * 100) / 100;
  }
}
