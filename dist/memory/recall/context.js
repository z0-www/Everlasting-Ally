export const NO_RELIABLE_MEMORY = '未找到足够可靠的记忆。';
function content(candidate) {
    const raw = candidate.event.content;
    return typeof raw === 'string' ? raw : JSON.stringify(raw ?? '');
}
export function buildRecallContext(candidates, maxChars = 2000) {
    if (!candidates.length)
        return NO_RELIABLE_MEMORY;
    const lines = [];
    let used = 0;
    for (const candidate of candidates) {
        const line = '[' + candidate.event.actor + '|' + candidate.event.timestamp + '] ' + content(candidate) + ' (证据: ' + candidate.evidenceEventIds.join(', ') + ')';
        if (used + line.length + 1 > maxChars)
            break;
        lines.push(line);
        used += line.length + 1;
    }
    return lines.length ? lines.join('\n') : NO_RELIABLE_MEMORY;
}
