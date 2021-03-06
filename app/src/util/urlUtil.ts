

export const getUrlDisplayString = (url: string): string => {
  let cleanUrl = url;
  if (cleanUrl.startsWith('http://')) {
    cleanUrl = cleanUrl.slice('http://'.length);
  }
  if (cleanUrl.startsWith('https://')) {
    cleanUrl = cleanUrl.slice('https://'.length);
  }
  while (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, cleanUrl.length - 1);
  }
  return cleanUrl;
};

export const getLinkableUrl = (url: string): string => {
  let linkableUrl = url;
  if (!linkableUrl.startsWith('http://') && !linkableUrl.startsWith('https://')) {
    linkableUrl = `http://${linkableUrl}`;
  }
  return linkableUrl;
};
