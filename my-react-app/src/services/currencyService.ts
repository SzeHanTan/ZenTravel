export const formatPrice = (
  amountInMYR: number, 
  targetCurrency: { code: string }, 
  rates: { [key: string]: number }
): string => {
  const parts = targetCurrency.code.split(' | ');
  const symbol = parts[0]; 
  const currencyCode = parts[1]; 
  const rate = rates[currencyCode] || 1;
  const convertedAmount = (amountInMYR * rate).toFixed(2);

  return `${symbol} ${convertedAmount}`;
};