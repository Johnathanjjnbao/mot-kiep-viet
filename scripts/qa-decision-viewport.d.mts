import type { Browser } from '@playwright/test';
import type { GameRun } from '../src/domain/model';
import type { DecisionMeasurement } from './decision-viewport.mjs';
export interface ViewportCase {
  name: string;
  width: number;
  height: number;
  mobile?: boolean;
  large?: boolean;
}
export const viewportCases: ViewportCase[];
export function viewportJourney(
  browser: Browser,
  target: string,
  config: ViewportCase,
  evidencePrefix?: string,
): Promise<{
  report: {
    status: string;
    config: ViewportCase;
    measurements: DecisionMeasurement[];
    errors: string[];
    decisions?: number;
    choiceCounts?: number[];
  };
  run: GameRun;
}>;

export const viewportVersion: string;
