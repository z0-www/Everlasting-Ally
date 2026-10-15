import type { MemoryEvent, SessionEventLike, SessionLike } from './types.js';
export type CaptureClock = () => string;
export type MemoryEventHandler = (event: MemoryEvent) => void;
export declare class MemoryCapture {
    private readonly onCaptured?;
    private readonly clock;
    private readonly calls;
    private readonly capturedEvents;
    private sequence;
    constructor(onCaptured?: MemoryEventHandler | undefined, clock?: CaptureClock);
    capture(session: SessionLike, rawEvent: SessionEventLike): MemoryEvent | null;
    handleSessionEvent(session: SessionLike, event: SessionEventLike): MemoryEvent | null;
    get events(): readonly MemoryEvent[];
}
