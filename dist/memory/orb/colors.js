export const EMOTION_COLORS = {
    joy: '#F5C542',
    sadness: '#4A90E2',
    anger: '#D64545',
    fear: '#8E5CC7',
    curiosity: '#2DB7A3',
    anticipation: '#F28C28',
    surprise: '#E7A93B',
    neutral: '#9AA0A6',
    unknown: '#9AA0A680',
};
export function colorForEmotion(label) {
    return { label, color: EMOTION_COLORS[label], alpha: label === 'unknown' ? 0.5 : 1 };
}
export function colorsForEmotions(labels) {
    return labels.map(colorForEmotion);
}
