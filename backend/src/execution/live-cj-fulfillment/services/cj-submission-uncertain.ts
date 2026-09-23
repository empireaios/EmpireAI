/** The provider may have accepted this order: reconcile before any retry. */
export class LiveCjSubmissionUncertainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveCjSubmissionUncertainError";
  }
}
