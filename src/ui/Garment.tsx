import type { ClothingItem } from '../content/clothing';
export function Garment({ item }: { item: ClothingItem }) {
  const shapes = {
    tee:'M21 12 9 20l-6 15 13 6 5-10v37h38V31l5 10 13-6-6-15-12-8q-18 12-38 0Z',
    shirt:'M24 11 10 20l-7 19 12 5 7-16v40h36V28l7 16 12-5-7-19-14-9Z',
    dress:'M28 10 18 22l9 18L10 70h60L53 40l9-18-10-12q-12 10-24 0Z',
    aodai:'M27 8 16 17 9 40l10 4 8-18-7 43h16l4-21 4 21h16l-7-43 8 18 10-4-7-23-11-9Z',
    trousers:'M21 9h38l-3 62H42l-2-40-3 40H23Z',
    skirt:'M25 12h30l17 58H8Z',
    jacket:'M27 8 12 18 4 47l12 6 9-22-5 38h18V30L32 8Zm21 0 15 10 13 29-12 6-9-22 5 38H42V30Z',
    vest:'M26 10 17 23v44l17-4 6-10 6 10 17 4V23L54 10 40 36Z',
    sport:'M22 12 10 22 4 39l14 5 5-13v37h34V31l5 13 14-5-6-17-12-10Z',
    shoes:'M14 22h16v25l-3 10H3V45l9-7Zm36 0h16l2 16 9 7v12H53l-3-10Z',
    ribbon:'M39 34 13 15 7 51l28-9 10 7 25 8 3-37-29 14Z',
    hat:'M23 18h34l7 29 12 13H4l12-13Z',
    scarf:'M17 18q23 18 46 0L53 40 45 36 58 69 42 73 34 42l-9 21-12-8 17-19Z',
    glasses:'M3 26h32v24H3Zm42 0h32v24H45ZM35 31h10v5H35Z',
  };
  return <svg viewBox="0 0 80 80" aria-hidden="true" className="garment-illustration"><g fill={item.color} stroke="#55483c" strokeWidth="1.3" strokeLinejoin="round"><path d={shapes[item.shape]} />{item.shape==='shirt' && <path d="M24 11 34 28 40 19 46 28 56 11M40 20v46" fill="#e7ddc7" />}{item.shape==='skirt' && <path d="m31 17-9 49m18-49v49m9-49 9 49" fill="none" />}{item.shape==='sport' && <path d="m28 20 3 35m21-35-3 35" stroke="#e7ddc7" strokeWidth="4" />}{item.shape==='aodai' && <path d="M40 10v37m0-3 5 23" fill="none" stroke="#ead5b0" />}{item.id==='striped-tee' && <path d="M23 36h34m-34 10h34m-34 10h34" stroke="#e9ddbf" strokeWidth="3" />}</g></svg>;
}
