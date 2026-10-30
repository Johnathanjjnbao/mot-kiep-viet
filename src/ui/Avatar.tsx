import { useId } from 'react';
import type { GameRun } from '../domain/model';
import { avatarState } from './appearance';
export function Avatar({
  run,
  portrait = false,
  biologicalAge,
}: {
  run: Pick<GameRun, 'seed' | 'month' | 'player'>;
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
  return (
    <svg
      className={`living-avatar ${portrait ? 'avatar-portrait' : ''}`}
      viewBox={portrait ? '30 7 100 112' : '0 0 160 240'}
      role="img"
      aria-label={`${stageName} · ${expression}`}
      data-avatar={a.key}
      data-stage={stage}
      data-expression={expression}
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
              d={`M${80 - waist} ${bodyEnd - 7}H${80 + waist}l-5 50H85l-5-35-5 35H${85 - waist}Z`}
              fill="#39464b"
            />
            <path d="M57 211h18v12H52q-5-4 5-12ZM86 211h17l7 12H86Z" fill="#574639" />
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
            fill={a.fabric}
          />
          <path
            d={`M68 ${bodyY - 3}q12 20 24 0M80 ${bodyY + 12}v${bodyEnd - bodyY - 15}`}
            fill="none"
            stroke="#f0ddbf"
            strokeWidth="2"
          />
          {infant && <path d="M51 147q28-15 57 0l-2 51q-27 25-55 0Z" fill="#d9bd91" />}
        </g>
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
        <g data-layer="face" fill="#302d29">
          <path
            d={`M64 ${headY - 5}q6-${expression === 'Lo lắng' ? 4 : 2} 11 0M86 ${headY - 5}q6-2 11 0`}
            fill="none"
          />
          <ellipse cx="69" cy={headY + 2} rx="2" ry={expression === 'Mệt mỏi' ? 1 : 2.8} />
          <ellipse cx="92" cy={headY + 2} rx="2" ry={expression === 'Mệt mỏi' ? 1 : 2.8} />
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
