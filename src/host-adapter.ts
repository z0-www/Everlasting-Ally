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
  private registerHostEffect(hostEffect: (setup: () => (() => void) | void, label?: string) => void, setup: () => (() => void) | void, label: string): void {
    const guardedSetup = () => {
      const cleanup = setup()
      if (typeof cleanup !== 'function') return
      const guarded = once(cleanup)
      this.cleanups.add(guarded)
      return () => { this.cleanups.delete(guarded); guarded() }
    }
    try { hostEffect(guardedSetup, label) }
    catch (error) { this.diagnosticsState.errors.push(errorText(error)); this.diagnosticsState.state = 'failed'; this.stop(); throw error }
  }

  effect(setup: () => (() => void) | void, label = 'everlasting-ally: effect'): void {
    if (this.stopped) throw new Error('HostAdapter has already stopped')
    if (typeof this.root.effect !== 'function') {
      const cleanup = setup()
      if (typeof cleanup === 'function') this.registerCleanup(cleanup, label)
      return
    }
    this.registerHostEffect(this.root.effect, setup, label)
  }

  injectTools(callback: (context: ToolContext) => void): void {
    if (this.stopped) throw new Error('HostAdapter has already stopped')
    try {
      this.root.inject(['tools'], (context) => callback({
        tools: context.tools,
        effect: (setup, label = 'everlasting-ally: tool effect') =>
          this.registerHostEffect(context.effect, setup, label),
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

