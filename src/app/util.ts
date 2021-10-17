export class Util {
  static toHoursMinutesSeconds(totalSeconds, dotsAsSeparator = true): string {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    let result = `${minutes.toString().padStart(1, '0')}${dotsAsSeparator ? ':' : 'm '}${seconds.toString()
      .padStart(2, '0')}${dotsAsSeparator ? '' : 's'}`;
    if (!!hours) {
      result = `${hours.toString()}${dotsAsSeparator ? ':' : 'h '}${minutes.toString()
        .padStart(2, '0')}${dotsAsSeparator ? ':' : 'm '}${seconds.toString()
        .padStart(2, '0')}${dotsAsSeparator ? '' : 's'}`;
    }
    if (!!days) {
      result = `${days} ${days > 1 ? 'days' : 'day'}, ${hours}  ${hours > 1 ? 'hours' : 'hour'}`;
    }
    return result;
  }

  static getTextColorForBackground(r, g, b): string {
    const brightness = Math.round(((parseInt(r, 10) * 299) +
      (parseInt(g, 10) * 587) + (parseInt(b, 10) * 114)) / 1000);
    return (brightness > 125) ? 'black' : 'white';
  }
}
