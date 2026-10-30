import { useId } from 'react';
import type { GameRun } from '../domain/model';
import { avatarState } from './appearance';
import { clothingById } from '../content/clothing';
export function Avatar({
  run,
  portrait = false,
  biologicalAge,
}: {
  run: Pick<GameRun, 'seed' | 'month' | 'player' | 'wardrobe'>;
  portrait?: boolean;
  biologicalAge?: number;
}) {
  const { identity: a, stage, stageName, expression } = avatarState(run, biologicalAge);
  const id = useId(),
    child = stage < 2,
    infant = stage === 0,
    elder = stage === 5;
  const hair = elder ? '#c4bdb0' : stage === 4 ? '#645b51' : a.hair;
  const headY = infant ? 65 : child ? 53 : stage === 2 ? 49 : 45,
    rx = infant ? 30 : child ? 27 : stage === 2 ? 25 : 24 + a.face,
    ry = infant ? 31 : child ? 30 : stage === 2 ? 30 : 32 + a.face;
  const shoulder = child ? 26 : stage === 2 ? 28 : 31 + a.silhouette * 3,
    waist = child ? 22 : stage === 2 ? 23 : 25 + a.silhouette * 2;
  const bodyY = headY + ry + 12,
    bodyEnd = infant ? 182 : child ? 171 : 166;
  const worn = (slot: string) =>
    clothingById(run.wardrobe?.equipped[slot as keyof typeof run.wardrobe.equipped] ?? '');
  const top = worn('top'),
    bottom = worn('bottom'),
    outer = worn('outer'),
    shoes = worn('shoes'),
    hairItem = worn('hair'),
    accessory = worn('accessory');
  const longTop = top?.shape === 'dress' || top?.shape === 'aodai';
  return (
    <svg
      className={`living-avatar ${portrait ? 'avatar-portrait' : ''}`}
      viewBox={portrait ? '30 7 100 112' : '0 0 160 240'}
      role="img"
      aria-label={`${stageName} · ${expression}`}
      data-avatar={a.key}
      data-stage={stage}
      data-expression={expression}
      data-wearing={Object.values(run.wardrobe?.equipped ?? {}).join(',')}
    >
      <title>{`${stageName} · ${expression}`}</title>
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#e9e3d3" />
          <stop offset="1" stopColor="#f8f1df" />
        </linearGradient>
      </defs>
      <rect width="160" height="240" rx="68" fill={`url(#${id})`} />
      <path
        d="M12 190Q30 125 42 200M118 200q22-75 30-38M15 210q60-25 130-4"
        fill="none"
        stroke="#b3b69c"
        strokeWidth="2"
      />
      <ellipse cx="80" cy="226" rx="42" ry="6" fill="#c4bba7" opacity=".5" />
      <g stroke="#493d34" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        {!infant && (
          <g data-layer="bottom">
            <path
              d={
                bottom?.shape === 'skirt' && !longTop
                  ? `M${80 - waist} ${bodyEnd - 8}h${waist * 2}l14 48H${66 - waist}Z`
                  : `M${80 - waist} ${bodyEnd - 7}H${80 + waist}l-5 50H85l-5-35-5 35H${85 - waist}Z`
              }
              fill={top?.shape === 'aodai' ? '#e9ddc7' : (bottom?.color ?? '#39464b')}
            />
            {bottom?.shape === 'skirt' && !longTop && (
              <path d={`M69 ${bodyEnd}l-5 36m16-36v36m11-36 5 36`} fill="none" opacity=".4" />
            )}
            <path
              data-layer="shoes"
              d="M57 211h18v12H52q-5-4 5-12ZM86 211h17l7 12H86Z"
              fill={shoes?.color ?? '#574639'}
            />
            {shoes?.id === 'running-shoes' && (
              <path d="M54 219h20m13 0h20m-48-4h10m20 0h10" stroke="#f2e9d4" />
            )}
          </g>
        )}
        <g data-layer="body">
          <path
            d={`M${80 - shoulder} ${bodyY + 8}q-16 20-15 53l12 2 13-41M${80 + shoulder} ${bodyY + 8}q16 20 15 53l-12 2-13-41`}
            fill={a.skin}
          />
          <path d={`M70 ${headY + 25}h20v24H70z`} fill={a.skin} />
        </g>
        <g data-layer="top">
          <path
            d={`M${80 - shoulder} ${bodyY}Q80 ${bodyY - 14} ${80 + shoulder} ${bodyY}l10 26-14 6-5-14 3 ${bodyEnd - bodyY - 18}Q80 ${bodyEnd + 7} ${80 - waist} ${bodyEnd}l3-${bodyEnd - bodyY - 18}-5 14-14-6Z`}
            fill={top?.color ?? a.fabric}
          />
          <path
            d={`M68 ${bodyY - 3}q12 20 24 0M80 ${bodyY + 12}v${bodyEnd - bodyY - 15}`}
            fill="none"
            stroke="#f0ddbf"
            strokeWidth="2"
          />
          {longTop && !infant && (
            <path
              d={`M${80 - waist} ${bodyEnd - 15}h${waist * 2}l${top?.shape === 'dress' ? 14 : 4} 53H${80 - waist - (top?.shape === 'dress' ? 14 : 4)}Z`}
              fill={top?.color}
            />
          )}
          {top?.shape === 'aodai' && !infant && (
            <path d={`M80 ${bodyY}v103m0-30-9 30`} fill="none" stroke="#dfc18b" />
          )}
          {top?.shape === 'shirt' && (
            <path
              d={`M67 ${bodyY - 2}l9 13 4-8 5 8 9-13M80 ${bodyY + 8}v${bodyEnd - bodyY - 12}`}
              fill="#e7dfcb"
            />
          )}
          {top?.id === 'striped-tee' && (
            <path d={`M54 ${bodyY + 23}h52m-50 10h48m-47 10h46`} stroke="#f1dfbb" strokeWidth="4" />
          )}
          {top?.shape === 'sport' && (
            <path d={`M60 ${bodyY + 6}l7 42m30-42-7 42`} stroke="#dddfb5" strokeWidth="5" />
          )}
          {top?.id === 'floral-dress' && (
            <g fill="#dbc997" stroke="none">
              {[0, 1, 2, 3, 4].map((i) => (
                <path
                  key={i}
                  d={`M${62 + (i % 2) * 23} ${bodyY + 16 + i * 15}q-8-12 2-5 10-9 5 2-5 11-7 3Z`}
                />
              ))}
            </g>
          )}
          {infant && <path d="M51 147q28-15 57 0l-2 51q-27 25-55 0Z" fill="#d9bd91" />}
        </g>
        {outer && !infant && (
          <g data-layer="outerwear" fill={outer.color}>
            <path
              d={`M${80 - shoulder} ${bodyY}l13-4 8 33-7 36H${80 - waist - 5}l-3-45-10 15-11-7Z M${80 + shoulder} ${bodyY}l-13-4-8 33 7 36h${waist - 8}l3-45 10 15 11-7Z`}
            />
            <path d={`M65 ${bodyY}l12 21-12 8m30-29-12 21 12 8`} fill="none" stroke="#dec8a6" />
            {outer.shape === 'jacket' && (
              <path d={`M57 ${bodyY + 36}h12v9H57m34-9h12v9H91`} fill="none" />
            )}
          </g>
        )}
        {accessory?.shape === 'scarf' && (
          <path
            data-layer="accessory"
            d={`M67 ${bodyY - 6}q13 10 26 0l-5 12-6-4-5 24-8-5 7-24Z`}
            fill={accessory.color}
          />
        )}
        <g data-layer="head">
          <ellipse cx="55" cy={headY + 4} rx="5" ry="9" fill={a.skin} />
          <ellipse cx="105" cy={headY + 4} rx="5" ry="9" fill={a.skin} />
          <ellipse cx="80" cy={headY} rx={rx} ry={ry} fill={a.skin} />
          <path
            d={`M${80 - rx - 2} ${headY + 5}C${80 - rx - 6} ${headY - 46} ${80 + rx + 6} ${headY - 46} ${80 + rx + 2} ${headY + 5}L${80 + rx - 4} ${headY - 10}Q80 ${headY - 2} ${80 - rx + 4} ${headY - 13}Z`}
            fill={hair}
          />
          {!infant && a.style === 1 && (
            <path
              d={`M54 ${headY - 10}q-17 46 1 52l6-13M105 ${headY - 10}q18 46-1 52l-6-13`}
              fill={hair}
            />
          )}
          {!infant && a.style === 2 && (
            <path
              d={`M52 ${headY - 11}q-7 60 5 69l5-45M106 ${headY - 11}q8 65-6 77l-5-47`}
              fill={hair}
            />
          )}
          {!infant && a.style === 3 && (
            <path d={`M56 ${headY - 21}q-12-30 11-23 18-18 21 0 27-7 15 23`} fill={hair} />
          )}
          {!infant && a.style === 4 && (
            <path
              d={`M57 ${headY - 15}q25-38 45-7M58 ${headY - 19}q18-30 35-18`}
              fill="none"
              stroke={elder ? '#eee6d5' : '#7b6450'}
              strokeWidth="5"
            />
          )}
        </g>
        {hairItem && (
          <g data-layer="hair-accessory" fill={hairItem.color}>
            {hairItem.shape === 'hat' ? (
              <path d={`M51 ${headY - 15}l8-27h42l8 27 11 7H40Z`} />
            ) : (
              <path d={`M101 ${headY - 17}l-11-11-2 15 12 2 9 11 5-15Z`} />
            )}
          </g>
        )}
        <g data-layer="face" fill="#302d29">
          <path
            d={`M64 ${headY - 5}q6-${expression === 'Lo lắng' ? 4 : 2} 11 0M86 ${headY - 5}q6-2 11 0`}
            fill="none"
          />
          <ellipse cx="69" cy={headY + 2} rx="2" ry={expression === 'Mệt mỏi' ? 1 : 2.8} />
          <ellipse cx="92" cy={headY + 2} rx="2" ry={expression === 'Mệt mỏi' ? 1 : 2.8} />
          {accessory?.shape === 'glasses' && (
            <g data-layer="accessory" fill="none" stroke={accessory.color} strokeWidth="2">
              <circle cx="69" cy={headY + 3} r="9" />
              <circle cx="92" cy={headY + 3} r="9" />
              <path d={`M78 ${headY + 2}h5`} />
            </g>
          )}
          <path
            d={`M80 ${headY + 4}l-2 9 5 1M70 ${headY + 21}q10 ${expression === 'Vui vẻ' ? 9 : expression === 'Lo lắng' ? -5 : 3} 20 0`}
            fill="none"
          />
          <ellipse
            cx="61"
            cy={headY + 13}
            rx="5"
            ry="2"
            fill="#bf7765"
            opacity=".3"
            stroke="none"
          />
          <ellipse
            cx="101"
            cy={headY + 13}
            rx="5"
            ry="2"
            fill="#bf7765"
            opacity=".3"
            stroke="none"
          />
          {stage >= 4 && (
            <g fill="none" stroke="#9a755e" strokeWidth="1">
              <path d={`M61 ${headY + 5}l-4 2m39-2 5 2M70 ${headY - 17}q10-3 20 0`} />
              {elder && <path d={`M64 ${headY + 18}l-3 7m37-7 3 7M67 ${headY - 12}q12-3 25 0`} />}
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
