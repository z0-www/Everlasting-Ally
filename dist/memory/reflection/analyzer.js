import { buildEvidenceChain, eventText } from './evidence.js';
export const LOCAL_REFLECTION_VERSION = 'local-reflection-1';
function ids(events) {
    return events.map((event) => event.id);
}
function record(type, title, summary, lesson, input, sourceEvents, confidence, status, now) {
    const sourceEventIds = ids(sourceEvents);
    const orbIds = input.orbs.filter((orb) => orb.sourceEventIds.some((id) => sourceEventIds.includes(id))).map((orb) => orb.id);
    return {
        id: 'reflection:' + type + ':' + sourceEventIds.join(',') + ':' + LOCAL_REFLECTION_VERSION,
        reflectionType: type, title, summary, lesson, sourceEventIds, sourceOrbIds: orbIds,
        sessionIds: [...new Set(sourceEvents.map((event) => event.sessionId))],
        evidenceStatus: sourceEvents.length >= 2 ? 'complete' : 'partial',
        confidence, verificationStatus: status, analysisMethod: 'local-rules',
        analysisVersion: LOCAL_REFLECTION_VERSION, createdAt: now, updatedAt: now,
    };
}
export class LocalReflectionAnalyzer {
    now;
    constructor(now = () => new Date().toISOString()) {
        this.now = now;
    }
    analyze(input) {
        const chain = buildEvidenceChain(input.events);
        if (!chain.events.length)
            return [];
        const now = this.now();
        const output = [];
        if (chain.failures.length) {
            const failure = chain.failures[0];
            output.push(record('mistake', '工具执行出现失败证据', '历史工具结果包含失败信号：' + eventText(failure), '处理类似任务时应先确认工具和依赖条件，并在失败后重新验证方案。', input, [...chain.events.filter((event) => event.eventSeq !== undefined), failure], 0.8, 'inferred', now));
        }
        if (chain.corrections.length) {
            output.push(record('correction', '用户提供了纠正线索', '用户消息包含明确的纠正表达，说明先前方案需要复核：' + eventText(chain.corrections[0]), '后续应优先核对用户提供的事实，再调整方案。', input, chain.events, 0.72, 'inferred', now));
        }
        if (chain.toolResults.length && !chain.failures.length && chain.confirmedSuccesses.length) {
            output.push(record('verified_success', '工具证据与用户确认同时存在', '工具结果和用户确认共同支持这次结果已经完成。', null, input, chain.events, 0.86, 'confirmed', now));
        }
        else if (chain.toolResults.length && chain.assistantEvents.some((event) => /已完成|完成了|done|completed|success/i.test(eventText(event)))) {
            output.push(record('unresolved', '助手声称完成但缺少用户确认', '助手消息表达了完成意图，但历史中没有足够的用户确认或完整验证证据。', '不要把助手的自我声明当作经过验证的成功。', input, chain.events, 0.62, 'needs_review', now));
        }
        if (chain.userEvents.length && chain.assistantEvents.length) {
            output.push(record('shared_experience', '用户与助手共同参与了这次会话', '这段会话同时包含用户经历和助手行为，记录为可追溯的共同经历。', null, input, chain.events, 0.55, 'inferred', now));
        }
        if (!output.length) {
            output.push(record('unresolved', '历史证据不足', '现有事件无法支持确定的错误、成功或纠正结论。', null, input, chain.events, 0.25, 'needs_review', now));
        }
        return output;
    }
}
export function createUnavailableReflectionProvider() {
    return {
        name: 'unavailable',
        async analyze() {
            throw new Error('No verified DSH reflection model provider is configured.');
        },
    };
}
