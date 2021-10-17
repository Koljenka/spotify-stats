import {Util} from './util';

describe('Util', () => {
  describe('getTextColorForBackground()', () => {
    it('should return white', () => {
      expect(Util.getTextColorForBackground(0, 0, 0)).toBe('white');
    });
    it('should return black', () => {
      expect(Util.getTextColorForBackground(255, 255, 255)).toBe('black');
    });
  });

  describe('toHoursMinutesSeconds()', () => {
    it('should return 1:03:05', () => {
      expect(Util.toHoursMinutesSeconds(3785)).toBe('1:03:05');
    });
    it('should return 1 day, 4  hours', () => {
      expect(Util.toHoursMinutesSeconds(102657 )).toBe('1 day, 4  hours');
    });
    it('should return 14:09', () => {
      expect(Util.toHoursMinutesSeconds(849)).toBe('14:09');
    });
    it('should return 2h 39m 31s', () => {
      expect(Util.toHoursMinutesSeconds(9571, false)).toBe('2h 39m 31s');
    });
    it('should return 2 days, 1  hour', () => {
      expect(Util.toHoursMinutesSeconds(177457 )).toBe('2 days, 1  hour');
    });
  });

});
