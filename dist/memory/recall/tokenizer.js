const STOP_WORDS = new Set(['the', 'and', 'for', 'that', 'this', 'with', 'from', 'what', 'when', 'where', '怎么', '什么', '这个', '那个', '请问']);
export function tokenize(text) {
    const lower = text.toLocaleLowerCase();
    const english = lower.match(/[a-z0-9][a-z0-9_-]*/g) ?? [];
    const han = [...lower].filter((char) => /[\u3400-\u9fff]/u.test(char));
    const bigrams = han.slice(0, -1).map((char, index) => char + han[index + 1]);
    return [...new Set([...english, ...han, ...bigrams].filter((token) => token.length > 1 && !STOP_WORDS.has(token)))];
}
