/**
 * Gets the time zone offset for a given time zone name.
 * @param timeZone The time zone to get the offset for, e.g. 'Europe/London'.
 * @param format The format of the offset. Defaults to 'shortOffset'.
 * @returns The time zone offset in the specified format: '+HH:mm' or '+h'.
 */
export function getTimeZoneOffset(timeZone: string, format: 'shortOffset' | 'longOffset' = 'shortOffset') {
  try {
    const date = Intl.DateTimeFormat([], { timeZone, timeZoneName: format });
    return date.format(new Date()).split(' ')[1].slice(3) || '+00:00';
  } catch (e) {
    console.warn(`Failed to get time zone offset for '${timeZone}'`, e);
    return undefined;
  }
}

/**
 * Converts a long time zone offset to a short time zone offset.
 * @param longTimezoneOffset The long time zone offset to convert, e.g. '+02:00' or '-05:00'.
 * @returns The short time zone offset, e.g. '+2' or '-5'.
 */
export function toShortTimezoneOffset(longTimezoneOffset: string) {
  return longTimezoneOffset.replace(/([+-])0?(\d+):00/, '$1$2');
}
