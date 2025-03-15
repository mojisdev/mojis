export class AdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdapterError";
  }

  static isAdapterError(error: unknown): error is AdapterError {
    return error instanceof AdapterError;
  }
}
