

export const truncateMiddle = (text: string, maxLength: number): string => {
  const diff = text.length - maxLength;
  if (diff > 0) {
    const start = text.substring(0, Math.ceil(maxLength / 2.0));
    const end = text.substring(text.length - Math.floor(maxLength / 2.0), text.length);
    return `${start}...${end}`;
  }
  return text;
};

export const truncateStart = (text: string, maxLength: number): string => {
  const diff = text.length - maxLength;
  if (diff > 0) {
    const start = text.substring(0, maxLength);
    return `${start}...`;
  }
  return text;
};
