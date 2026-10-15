function text(event) {
    return typeof event.content === 'string' ? event.content : JSON.stringify(event.content ?? '');
}
export function buildEvidenceChain(events) {
    const ordered = events.slice().sort((a, b) => (a.eventSeq ?? Number.MAX_SAFE_INTEGER) - (b.eventSeq ?? Number.MAX_SAFE_INTEGER));
    const userEvents = ordered.filter((event) => event.eventType === 'user_message');
    const assistantEvents = ordered.filter((event) => event.eventType === 'assistant_message');
    const toolCalls = ordered.filter((event) => event.eventType === 'tool_call');
    const toolResults = ordered.filter((event) => event.eventType === 'tool_result');
    const failures = toolResults.filter((event) => /error|失败|failed|false/i.test(text(event)));
    const corrections = userEvents.filter((event) => /不对|错误|纠正|应该|更正|correct|wrong|actually/i.test(text(event)));
    const confirmedSuccesses = userEvents.filter((event) => /解决了|可以了|确认成功|没问题|works|fixed|resolved|confirmed/i.test(text(event)));
    return { events: ordered, userEvents, assistantEvents, toolCalls, toolResults, failures, corrections, confirmedSuccesses };
}
export function eventText(event) {
    return text(event);
}
