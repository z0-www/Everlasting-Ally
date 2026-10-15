export function scoreImportance(event) {
    const text = typeof event.content === 'string' ? event.content : JSON.stringify(event.content ?? '');
    let score = 0.1;
    const reasons = [];
    if (/记住|别忘|重要|长期|remember|important|long[- ]term/i.test(text)) {
        score += 0.4;
        reasons.push('explicitly marked as worth remembering');
    }
    if (/目标|计划|项目|里程碑|goal|plan|project|milestone/i.test(text)) {
        score += 0.2;
        reasons.push('mentions a concrete goal or project');
    }
    if (event.candidateType === 'correction_candidate') {
        score += 0.25;
        reasons.push('identified as a correction candidate');
    }
    if (/更正|修正|纠正|correct|correction/i.test(text)) {
        score += 0.25;
        reasons.push('contains an explicit correction cue');
    }
    if (event.eventType === 'tool_result' && /error|失败|failed|false/i.test(text)) {
        score += 0.25;
        reasons.push('contains evidence of a tool failure');
    }
    if (event.eventType === 'tool_result' && /"ok"\s*:\s*true|"success"\s*:\s*true/i.test(text)) {
        score += 0.15;
        reasons.push('contains an explicit tool result success signal');
    }
    const bounded = Math.min(1, score);
    return { score: bounded, reasons, coreMemoryCandidate: bounded >= 0.7 };
}
