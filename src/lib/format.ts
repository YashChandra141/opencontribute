const enNumberFormatter = new Intl.NumberFormat('en-US');

export function formatNumber(value: number): string {
  return enNumberFormatter.format(value);
}
