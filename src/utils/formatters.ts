/**
 * Format a number into Indian Rupee representation (e.g., ₹1,25,000)
 */
export function formatINR(amount: number, showDecimals = false): string {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: showDecimals || absAmount % 1 !== 0 ? 2 : 0,
    minimumFractionDigits: showDecimals && absAmount % 1 !== 0 ? 2 : 0,
  }).format(absAmount);

  return `${amount < 0 ? '-' : ''}₹${formatted}`;
}

/**
 * Returns today's date formatted as YYYY-MM-DD for standard date input
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Human friendly date representation (Today, Yesterday, or 15 Sep 2026)
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  
  const todayStr = getTodayDateString();
  
  // Calculate yesterday string
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yYear = yesterday.getFullYear();
  const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
  const yDay = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

  if (dateStr === todayStr) {
    return 'Today';
  }
  if (dateStr === yesterdayStr) {
    return 'Yesterday';
  }

  // Parse date components safely
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;

  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}
