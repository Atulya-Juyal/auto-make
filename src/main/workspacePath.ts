/** Single source of truth for the app workspace directory (used by fs + terminal cwd). */
let workspacePath = process.cwd()

export function getWorkspacePath(): string {
  return workspacePath
}

export function setWorkspacePath(resolved: string): void {
  workspacePath = resolved
}
