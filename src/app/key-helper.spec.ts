import {KeyHelper} from './key-helper';

describe('KeyHelper', () => {
  describe('getKey()', () => {
    it('should return C', () => {
      expect(KeyHelper.getKey(0)).toBe('C');
    });
    it('should return C♯/D♭', () => {
      expect(KeyHelper.getKey(1)).toBe('C♯/D♭');
    });
    it('should return D', () => {
      expect(KeyHelper.getKey(2)).toBe('D');
    });
    it('should return D♯/E♭', () => {
      expect(KeyHelper.getKey(3)).toBe('D♯/E♭');
    });
    it('should return E', () => {
      expect(KeyHelper.getKey(4)).toBe('E');
    });
    it('should return F', () => {
      expect(KeyHelper.getKey(5)).toBe('F');
    });
    it('should return F♯/G♭', () => {
      expect(KeyHelper.getKey(6)).toBe('F♯/G♭');
    });
    it('should return G', () => {
      expect(KeyHelper.getKey(7)).toBe('G');
    });
    it('should return G♯/A♭', () => {
      expect(KeyHelper.getKey(8)).toBe('G♯/A♭');
    });
    it('should return A', () => {
      expect(KeyHelper.getKey(9)).toBe('A');
    });
    it('should return A♯/B♭', () => {
      expect(KeyHelper.getKey(10)).toBe('A♯/B♭');
    });
    it('should return B', () => {
      expect(KeyHelper.getKey(11)).toBe('B');
    });
    it('should return N/A', () => {
      expect(KeyHelper.getKey(98)).toBe('N/A');
    });
  });

  describe('getTabForKeyAndMode()', () => {
    describe('Major', () => {
      it('should return CM_Am.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(0, 1)).toBe('http://localhost:4200/assets/keys/CM_Am.svg');
      });
      it('should return CsM_Asm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(1, 1)).toBe('http://localhost:4200/assets/keys/CsM_Asm.svg');
      });
      it('should return DM_Bm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(2, 1)).toBe('http://localhost:4200/assets/keys/DM_Bm.svg');
      });
      it('should return EfM_Cm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(3, 1)).toBe('http://localhost:4200/assets/keys/EfM_Cm.svg');
      });
      it('should return EM_Csm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(4, 1)).toBe('http://localhost:4200/assets/keys/EM_Csm.svg');
      });
      it('should return FM_Dm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(5, 1)).toBe('http://localhost:4200/assets/keys/FM_Dm.svg');
      });
      it('should return GfM_Efm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(6, 1)).toBe('http://localhost:4200/assets/keys/GfM_Efm.svg');
      });
      it('should return GM_Em.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(7, 1)).toBe('http://localhost:4200/assets/keys/GM_Em.svg');
      });
      it('should return AfM_Fm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(8, 1)).toBe('http://localhost:4200/assets/keys/AfM_Fm.svg');
      });
      it('should return AM_Fsm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(9, 1)).toBe('http://localhost:4200/assets/keys/AM_Fsm.svg');
      });
      it('should return BfM_Gm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(10, 1)).toBe('http://localhost:4200/assets/keys/BfM_Gm.svg');
      });
      it('should return BM_Gsm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(11, 1)).toBe('http://localhost:4200/assets/keys/BM_Gsm.svg');
      });
      it('should return CM_Am.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(91, 1)).toBe('http://localhost:4200/assets/keys/CM_Am.svg');
      });
    });
    describe('Minor', () => {
      it('should return EfM_Cm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(0, 0)).toBe('http://localhost:4200/assets/keys/EfM_Cm.svg');
      });
      it('should return EM_Csm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(1, 0)).toBe('http://localhost:4200/assets/keys/EM_Csm.svg');
      });
      it('should return FM_Dm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(2, 0)).toBe('http://localhost:4200/assets/keys/FM_Dm.svg');
      });
      it('should return GfM_Efm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(3, 0)).toBe('http://localhost:4200/assets/keys/GfM_Efm.svg');
      });
      it('should return GM_Em.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(4, 0)).toBe('http://localhost:4200/assets/keys/GM_Em.svg');
      });
      it('should return AfM_Fm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(5, 0)).toBe('http://localhost:4200/assets/keys/AfM_Fm.svg');
      });
      it('should return AM_Fsm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(6, 0)).toBe('http://localhost:4200/assets/keys/AM_Fsm.svg');
      });
      it('should return BfM_Gm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(7, 0)).toBe('http://localhost:4200/assets/keys/BfM_Gm.svg');
      });
      it('should return CfM_Afm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(8, 0)).toBe('http://localhost:4200/assets/keys/CfM_Afm.svg');
      });
      it('should return CM_Am.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(9, 0)).toBe('http://localhost:4200/assets/keys/CM_Am.svg');
      });
      it('should return CsM_Asm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(10, 0)).toBe('http://localhost:4200/assets/keys/CsM_Asm.svg');
      });
      it('should return DM_Bm.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(11, 0)).toBe('http://localhost:4200/assets/keys/DM_Bm.svg');
      });
      it('should return CM_Am.svg', () => {
        expect(KeyHelper.getTabForKeyAndMode(91, 0)).toBe('http://localhost:4200/assets/keys/CM_Am.svg');
      });
    });
  });
});
