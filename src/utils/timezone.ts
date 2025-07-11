// Utility functions untuk timezone Jakarta
export const getJakartaDate = (date?: Date): Date => {
  const now = date || new Date();
  // Konversi ke timezone Jakarta (UTC+7)
  const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return jakartaTime;
};

export const formatDateForInput = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateTimeForDisplay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const jakartaDate = getJakartaDate(dateObj);
  return jakartaDate.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getCurrentJakartaTime = (): Date => {
  return getJakartaDate();
};