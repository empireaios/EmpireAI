export class LiveCjFulfillmentBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveCjFulfillmentBlockedError";
  }
}

