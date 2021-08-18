
export const isMobile = (): boolean => {
  const searchRegexs = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
  ];

  return searchRegexs.some((searchRegex: RegExp): boolean => searchRegex.test(navigator.userAgent));
};
