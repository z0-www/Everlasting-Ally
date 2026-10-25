export type ToolDefinition = {
  name: string
  description: string
  parameters: Record<string, unknown>
  output: {
    schema: Record<string, unknown>
    render(args: unknown, value: unknown): Array<Record<string, unknown>>
  }
  execute(args: unknown): Promise<unknown>
}

export type ToolContext = {
  tools: { register(definition: ToolDefinition): () => void }
  effect(setup: () => (() => void) | void, label?: string): void
}

export type HostRoot = {
  inject(services: string[], callback: (context: ToolContext) => void): void
  on?: (event: string, listener: (session: unknown, event: unknown) => void) => (() => void) | void
  effect?: (setup: () => (() => void) | void, label?: string) => void
}

export type HostCapability = 'tools' | 'eventSubscription' | 'lifecycleEffects'
export type HostCapabilityStatus = { available: boolean; verified: boolean; reason?: string }
export type HostDiagnostics = {
  hostVersion: string | null
  apiVersion: 'unverified'
  capabilities: Record<HostCapability, HostCapabilityStatus>
  state: 'created' | 'started' | 'stopped' | 'failed'
  errors: string[]
}
export type AdapterSubscription = { supported: boolean; cleanupRegistered: boolean; reason?: string }

function once(cleanup: () => void): () => void {
  let done = false
  return () => { if (done) return; done = true; cleanup() }
}
function errorText(error: unknown): string { return error instanceof Error ? error.message : String(error) }

export class HostAdapter {
  private readonly cleanups = new Set<() => void>()
  private stopped = false
  private started = false
  private readonly diagnosticsState: HostDiagnostics

  constructor(private readonly root: HostRoot, hostVersion?: string) {
    this.diagnosticsState = {
      hostVersion: typeof hostVersion === 'string' && hostVersion.trim() ? hostVersion : null,
      apiVersion: 'unverified',
      capabilities: {
        tools: { available: typeof root.inject === 'function', verified: false, reason: 'verified only by a real host contract test' },
        eventSubscription: { available: typeof root.on === 'function', verified: false, reason: typeof root.on === 'function' ? 'runtime seam present; host version not verified' : 'optional event seam unavailable' },
        lifecycleEffects: { available: typeof root.effect === 'function', verified: false, reason: typeof root.effect === 'function' ? 'runtime seam present; host version not verified' : 'optional lifecycle seam unavailable' },
      },
      state: 'created', errors: [],
    }
  }

  get diagnostics(): HostDiagnostics {
    return {
      ...this.diagnosticsState,
      capabilities: Object.fromEntries(Object.entries(this.diagnosticsState.capabilities).map(([key, value]) => [key, { ...value }])) as HostDiagnostics['capabilities'],
      errors: [...this.diagnosticsState.errors],
    }
  }

  start(startup?: () => void): void {
    if (this.stopped) throw new Error('HostAdapter has already stopped')
    if (this.started) return
    try { startup?.(); this.started = true; this.diagnosticsState.state = 'started' }
    catch (error) { this.diagnosticsState.state = 'failed'; this.diagnosticsState.errors.push(errorText(error)); this.stop(); throw error }
  }

  registerCleanup(cleanup: () => void, label = 'everlasting-ally: cleanup'): () => void {
    const guarded = once(cleanup)
    this.cleanups.add(guarded)
    if (typeof this.root.effect === 'function') {
      try { this.root.effect(() => guarded, label) }
      catch (error) { this.diagnosticsState.errors.push(errorText(error)); this.cleanups.delete(guarded); guarded(); throw error }
    }
    return () => { this.cleanups.delete(guarded); guarded() }
  }

  subscribe(event: string, listener: (session: unknown, payload: unknown) => void): AdapterSubscription {
    if (this.stopped) return { supported: false, cleanupRegistered: false, reason: 'adapter stopped' }
    if (typeof this.root.on !== 'function') return { supported: false, cleanupRegistered: false, reason: 'host event subscription is unavailable' }
    try {
      const cleanup = this.root.on(event, listener)
      if (typeof cleanup !== 'function') return { supported: true, cleanupRegistered: false, reason: 'host registered the listener without returning a disposer' }
      this.registerCleanup(cleanup, `everlasting-ally: ${event} subscription`)
      return { supported: true, cleanupRegistered: true }
    } catch (error) { this.diagnosticsState.errors.push(errorText(error)); this.diagnosticsState.state = 'failed'; throw error }
  }

  injectTools(callback: (context: ToolContext) => void): void {
    if (this.stopped) throw new Error('HostAdapter has already stopped')
    try {
      this.root.inject(['tools'], (context) => callback({
        tools: context.tools,
        effect: (setup, label) => { const cleanup = setup(); if (typeof cleanup === 'function') this.registerCleanup(cleanup, label) },
      }))
    } catch (error) { this.diagnosticsState.errors.push(errorText(error)); this.diagnosticsState.state = 'failed'; this.stop(); throw error }
  }

  stop(): void {
    if (this.stopped) return
    this.stopped = true
    for (const cleanup of [...this.cleanups].reverse()) { try { cleanup() } catch (error) { this.diagnosticsState.errors.push(errorText(error)) } }
    this.cleanups.clear(); this.diagnosticsState.state = 'stopped'
  }
}

export function detectHostCapabilities(root: HostRoot, hostVersion?: string): HostDiagnostics { return new HostAdapter(root, hostVersion).diagnostics }

