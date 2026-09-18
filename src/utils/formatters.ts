/**
 * Utility formatters for Brazilian Real (BRL), percentages, volume, and dates
 */

export function formatCurrency(value: number | null | undefined, isPoints: boolean = false): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  if (isPoints) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' pts';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatChangeCurrency(value: number | null | undefined, isPoints: boolean = false): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  const sign = value > 0 ? '+' : '';
  if (isPoints) {
    return `${sign}${new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)} pts`;
  }

  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  return value > 0 ? `+${formatted}` : (value < 0 ? `-${formatted}` : formatted);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2).replace('.', ',')}%`;
}

export function formatVolume(volume: number | null | undefined): string {
  if (volume === null || volume === undefined || isNaN(volume) || volume === 0) {
    return '—';
  }

  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(2).replace('.', ',')} B`;
  }
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2).replace('.', ',')} M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1).replace('.', ',')} K`;
  }
  return volume.toLocaleString('pt-BR');
}

export function formatSecondsCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
