export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return "Today";
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function calculateMonthlyPayment(total: number, apr: number, termMonths: number) {
  if (termMonths <= 0) {
    return 0;
  }

  const monthlyRate = apr / 100 / 12;
  if (monthlyRate <= 0) {
    return total / termMonths;
  }

  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (total * monthlyRate * factor) / (factor - 1);
}
