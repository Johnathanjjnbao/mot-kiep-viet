import type { Page } from '@playwright/test';
import type { GameRun } from '../src/domain/model';
export interface ViewportRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
  height: number;
  width: number;
}
export interface MeasuredElement extends ViewportRect {
  readable: boolean;
  unobscured: boolean;
}
export interface DecisionMeasurement {
  viewport: { width: number; height: number };
  documentScroll: number;
  hud: MeasuredElement;
  narrative: MeasuredElement;
  firstChoice: MeasuredElement;
  list: ViewportRect;
  stats: Array<
    MeasuredElement & { key: string; text: string; label: MeasuredElement; value: MeasuredElement }
  >;
  overflow: boolean;
  choiceCount: number;
  narrativeLength: number;
  longestChoice: number;
  focused: string;
}
export function decisionMeasurement(page: Page): Promise<DecisionMeasurement>;
export function assertDecisionViewport(page: Page): Promise<DecisionMeasurement>;
export function clickChoiceWithoutDocumentScroll(
  page: Page,
  index: number,
  touch?: boolean,
): Promise<void>;
export function readGuestRun(page: Page): Promise<GameRun>;
