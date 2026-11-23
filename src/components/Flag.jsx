import KG from 'country-flag-icons/react/3x2/KG';
import ID from 'country-flag-icons/react/3x2/ID';
import VN from 'country-flag-icons/react/3x2/VN';
import LK from 'country-flag-icons/react/3x2/LK';
import CN from 'country-flag-icons/react/3x2/CN';
import NP from 'country-flag-icons/react/3x2/NP';
import MN from 'country-flag-icons/react/3x2/MN';
import MM from 'country-flag-icons/react/3x2/MM';

// SVG flags, because emoji flags show up as plain letters on Windows.
const FLAGS = { KG, ID, VN, LK, CN, NP, MN, MM };

export function Flag({ code, className = '' }) {
  const F = FLAGS[code];
  return F ? <F className={`flag ${className}`} aria-hidden="true" /> : null;
}
