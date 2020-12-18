export class KeyHelper {

  static getKey(keyNumber): string {
    switch (keyNumber) {
      case 0:
        return 'C';
      case 1:
        return 'C♯/D♭';
      case 2:
        return 'D';
      case 3:
        return 'D♯/E♭';
      case 4:
        return 'E';
      case 5:
        return 'F';
      case 6:
        return 'F♯/G♭';
      case 7:
        return 'G';
      case 8:
        return 'G♯/A♭';
      case 9:
        return 'A';
      case 10:
        return 'A♯/B♭';
      case 11:
        return 'B';
      default:
        return 'N/A';
    }
  }

  static getTabForKeyAndMode(keyNumber: number, mode: number): string {
    const prefix = '/assets/keys/';
    switch (keyNumber) {
      case 0:
        return prefix + (mode ? 'CM_Am.svg' : 'EfM_Cm.svg');
      case 1:
        return prefix + (mode ? 'CsM_Asm.svg' : 'EM_Csm.svg');
      case 2:
        return prefix + (mode ? 'DM_Bm.svg' : 'FM_Dm.svg');
      case 3:
        return prefix + (mode ? 'EfM_Cm.svg' : 'GfM_Efm.svg');
      case 4:
        return prefix + (mode ? 'EM_Csm.svg' : 'GM_Em.svg');
      case 5:
        return prefix + (mode ? 'FM_Dm.svg' : 'AfM_Fm.svg');
      case 6:
        return prefix + (mode ? 'GfM_Efm.svg' : 'AM_Fsm.svg');
      case 7:
        return prefix + (mode ? 'GM_Em.svg' : 'BfM_Gm.svg');
      case 8:
        return prefix + (mode ? 'AfM_Fm.svg' : 'CfM_Afm.svg');
      case 9:
        return prefix + (mode ? 'AM_Fsm.svg' : 'CM_Am.svg');
      case 10:
        return prefix + (mode ? 'BfM_Gm.svg' : 'CsM_Asm.svg');
      case 11:
        return prefix + (mode ? 'BM_Gsm.svg' : 'DM_Bm.svg');
      default:
        return 'CM_Am.svg';
    }

  }
}
