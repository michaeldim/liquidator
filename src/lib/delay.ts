export const delay = (ms: number): Promise<void> => new Promise((r): number => setTimeout(r, ms));
