import type { EmotionLabel } from './types.js';
export type OrbColor = {
    label: EmotionLabel;
    color: string;
    alpha: number;
};
export declare const EMOTION_COLORS: Record<EmotionLabel, string>;
export declare function colorForEmotion(label: EmotionLabel): OrbColor;
export declare function colorsForEmotions(labels: EmotionLabel[]): OrbColor[];
