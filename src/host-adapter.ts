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

export type ToolRegistrationContext = {
  tools: { register(definition: ToolDefinition): () => void }
  effect(setup: () => (() => void) | void, label?: string): void
}

export type HostRoot = {
  version?: string
  inject(
    paths: string[],
    callback: (context: ToolRegistrationContext) => void,
  ): void
  on?(
    event: string,
    listener: (...args: unknown[]) => void,
  ): (() => void) | void
  effect?(
    setup: () => (() => void) | void,
    label?: string,
  ): void
}

export type AdapterSubscription = {
  supported: boolean
  cleanupRegistered: boolean
  reason?: string
}

export type HostCapabilityStatus = 'available' | 'unsupported' | 'unverified'

export type HostCapability = {
  available: boolean
  status: HostCapabilityStatus
  reason?: string
}

export type HostDiagnostics = {
  hostVersion: string | null
  apiVersion: 'unverified'
  state: 'created' | 'running' | 'stopped' | 'failed'
  errors: string[]
  capabilities: {
    tools: HostCapability
    eventSubscription: HostCapability
    lifecycleEffects: HostCapability
  }
}

const once = (cleanup: () => void): (() => void) => {
  let called = false
  return () => {
    if (called) return
    called = true
    cleanup()
  }
}

const errorText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

export class HostAdapter {
  private readonly cleanups = new Set<() => void>()
  private stopped = false
  private started = false
  private readonly diagnosticsState: HostDiagnostics

  constructor(private readonly root: HostRoot, hostVersion = root.version ?? null) {
    this.diagnosticsState = {
      hostVersion,
      apiVersion: 'unverified',
      state: 'created',
      errors: [],
      capabilities: detectCapabilities(root),
    }
  }

  get diagnostics(): HostDiagnostics {
    return {
      ...this.diagnosticsState,
      errors: [...this.diagnosticsState.errors],
      capabilities: {
        tools: { ...this.diagnosticsState.capabilities.tools },
        eventSubscription: { ...this.diagnosticsState.capabilities.eventSubscription },
        lifecycleEffects: { ...this.diagnosticsState.capabilities.lifecycleEffects },
      },
    }
  }

  start(startup?: () => void): void {
    if (this.stopped) throw new Error('HostAdapter has already stopped')
    if (this.started) return
    this.started = true
    this.diagnosticsState.state = 'running'
    try {
      startup?.()
    } catch (error) {
      this.diagnosticsState.errors.push(errorText(error))
      this.diagnosticsState.state = 'failed'
      this.stop()
      throw error
    }
  }

  registerCleanup(cleanup: () => void, _label = 'everlasting-ally: cleanup'): void {
    if (this.stopped) {
      cleanup()
      return
    }
    this.cleanups.add(once(cleanup))
  }

  private registerHostEffect(
    hostEffect: (setup: () => (() => void) | void, label?: string) => void,
    setup: () => (() => void) | void,
    label: string,
  ): void {
    const guardedSetup = () => {
      const cleanup = setup()
      if (typeof cleanup !== 'function') return
      const guarded = once(cleanup)
      this.cleanups.add(guarded)
      return () => {
        this.cleanups.delete(guarded)
        guarded()
      }
    }
    try {
      hostEffect(guardedSetup, label)
    } catch (error) {
      this.diagnosticsState.errors.push(errorText(error))
      this.diagnosticsState.state = 'failed'
      this.stop()
      throw error
    }
  }

  effect(setup: () => (() => void) | void, label = 'everlasting-ally: effect'): void {
    if (this.stopped) throw new Error('HostAdapter has already stopped')
    if (typeof this.root.effect !== 'function') {
      const cleanup = setup()
      if (typeof cleanup === 'function') this.registerCleanup(cleanup, label)
      return
    }
    this.registerHostEffect(this.root.effect.bind(this.root), setup, label)
  }

  subscribe(event: string, listener: (...args: unknown[]) => void): AdapterSubscription {
    if (this.stopped) throw new Error('HostAdapter has already stopped')
    if (typeof this.root.on !== 'function') {
      return { supported: false, cleanupRegistered: false, reason: 'Host event API is unavailable' }
    }
    try {
      const disposer = this.root.on(event, listener)
      if (typeof disposer === 'function') {
        if (typeof this.root.effect === 'function') {
          this.registerHostEffect(this.root.effect.bind(this.root), () => disposer, `everlasting-ally: event ${event}`)
        } else {
          this.registerCleanup(disposer, `everlasting-ally: event ${event}`)
        }
      }
      return { supported: true, cleanupRegistered: typeof disposer === 'function' }
    } catch (error) {
      this.diagnosticsState.errors.push(errorText(error))
      this.diagnosticsState.state = 'failed'
      this.stop()
      throw error
    }
  }

  injectTools(callback: (context: ToolRegistrationContext) => void): void {
    if (this.stopped) throw new Error('HostAdapter has already stopped')
    try {
      this.root.inject(['tools'], (context) => callback(context))
    } catch (error) {
      this.diagnosticsState.errors.push(errorText(error))
      this.diagnosticsState.state = 'failed'
      this.stop()
      throw error
    }
  }

  stop(): void {
    if (this.stopped) return
    this.stopped = true
    for (const cleanup of [...this.cleanups].reverse()) {
      try { cleanup() } catch (error) { this.diagnosticsState.errors.push(errorText(error)) }
    }
    this.cleanups.clear()
    this.diagnosticsState.state = 'stopped'
  }
}

function detectCapabilities(root: HostRoot): HostDiagnostics['capabilities'] {
  return {
    tools: {
      available: typeof root.inject === 'function',
      status: typeof root.inject === 'function' ? 'available' : 'unsupported',
      reason: typeof root.inject === 'function' ? undefined : 'Host inject API is unavailable',
    },
    eventSubscription: {
      available: typeof root.on === 'function',
      status: typeof root.on === 'function' ? 'available' : 'unverified',
      reason: typeof root.on === 'function' ? undefined : 'Host event API was not provided',
    },
    lifecycleEffects: {
      available: typeof root.effect === 'function',
      status: typeof root.effect === 'function' ? 'available' : 'unverified',
      reason: typeof root.effect === 'function' ? undefined : 'Host effect API was not provided',
    },
  }
}

export function detectHostCapabilities(root: HostRoot, hostVersion?: string): HostDiagnostics {
  return new HostAdapter(root, hostVersion).diagnostics
}
