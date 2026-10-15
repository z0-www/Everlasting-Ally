import type { MemoryEvent, SessionEventLike, SessionLike } from './types.js';
export type CaptureClock = () => string;
export type MemoryEventHandler = (event: MemoryEvent) => void;
export type CaptureErrorHandler = (error: unknown) => void;
export type CaptureOptions = {
    maxRetainedEvents?: number;
};
export declare class MemoryCapture {
    private readonly onCaptured?;
    private readonly clock;
    private readonly onError?;
    private readonly calls;
    private readonly capturedEvents;
    private sequence;
    private readonly maxRetainedEvents;
    constructor(onCaptured?: MemoryEventHandler | undefined, clock?: CaptureClock, onError?: CaptureErrorHandler | undefined, options?: CaptureOptions);
    capture(session: SessionLike, rawEvent: SessionEventLike): MemoryEvent | null;
    handleSessionEvent(session: SessionLike, event: SessionEventLike): MemoryEvent | null;
    get events(): readonly MemoryEvent[];
}
