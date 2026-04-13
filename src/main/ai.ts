import { ipcMain, type WebContents } from 'electron'
import { StateGraph } from '@langchain/langgraph'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage, type BaseMessage } from '@langchain/core/messages'
import { getApiKeyFromSecureStorage } from './secrets'

type AiMode = 'Agent' | 'Plan' | 'Debug' | 'Ask'

type StartStreamPayload = {
  requestId: string
  messageId: string
  prompt: string
  aiMode: AiMode
  activeFileContent: string
}

const activeRequests = new Map<string, AbortController>()

const MAX_FILE_CONTEXT = 12000

function buildSystemPrompt(mode: AiMode, activeFileContent: string): string {
  const modePromptByType: Record<AiMode, string> = {
    Agent: 'You are an AI coding assistant focused on implementation. Be direct and practical.',
    Plan: 'You are an AI planning assistant. Explain trade-offs and provide clear implementation plans.',
    Debug: 'You are an AI debugging assistant. Diagnose root causes and suggest minimal, safe fixes first.',
    Ask: 'You are an AI assistant. Answer clearly and concisely.'
  }
  const trimmed = activeFileContent.trim()
  if (!trimmed) return modePromptByType[mode]
  return `${modePromptByType[mode]}\n\nThe user is currently looking at this file content:\n---\n${trimmed}\n---`
}

function safeSend(wc: WebContents, channel: string, payload: unknown): void {
  if (wc.isDestroyed()) return
  try {
    wc.send(channel, payload)
  } catch {
    /* window closed */
  }
}

function providerFromKey(apiKey: string): 'gemini' | 'openai' | 'unknown' {
  if (/^AIza[0-9A-Za-z_-]{20,}$/.test(apiKey)) return 'gemini'
  if (/^sk-[A-Za-z0-9_-]{20,}$/.test(apiKey)) return 'openai'
  return 'unknown'
}

function createPromptGraph() {
  const graph = new StateGraph<any>({
    channels: {
      messages: {
        value: (_prev: BaseMessage[], next: BaseMessage[]) => next,
        default: () => []
      },
      aiMode: {
        value: (_prev: AiMode, next: AiMode) => next,
        default: () => 'Ask' as AiMode
      },
      activeFileContent: {
        value: (_prev: string, next: string) => next,
        default: () => ''
      }
    }
  } as any)

  graph.addNode('prepareMessages', async (state: any) => {
    const capped = String(state.activeFileContent ?? '').slice(0, MAX_FILE_CONTEXT)
    const system = new SystemMessage(buildSystemPrompt((state.aiMode as AiMode) ?? 'Ask', capped))
    return { messages: [system, ...(state.messages as BaseMessage[])] }
  })
  graph.addEdge('__start__' as any, 'prepareMessages' as any)
  graph.addEdge('prepareMessages' as any, '__end__' as any)
  return graph
}

const compiledGraph = createPromptGraph().compile()

async function handleStream(eventSender: WebContents, payload: StartStreamPayload): Promise<void> {
  const { requestId, messageId, prompt, aiMode } = payload
  const activeFileContent = (payload.activeFileContent ?? '').slice(0, MAX_FILE_CONTEXT)
  const abort = new AbortController()
  activeRequests.set(requestId, abort)

  try {
    const apiKey = await getApiKeyFromSecureStorage()
    if (!apiKey) {
      safeSend(eventSender, 'ai.streamError', {
        requestId,
        messageId,
        error: 'No secure API key found. Open Settings and save your Gemini key first.'
      })
      return
    }

    const provider = providerFromKey(apiKey)
    if (provider === 'unknown') {
      safeSend(eventSender, 'ai.streamError', {
        requestId,
        messageId,
        error: 'Unsupported API key format. Save a Gemini (AIza...) or OpenAI (sk-...) key.'
      })
      return
    }

    const model =
      provider === 'gemini'
        ? new ChatGoogleGenerativeAI({
            apiKey,
            model: 'gemini-2.5-flash',
            temperature: 0.2
          })
        : new ChatOpenAI({
            apiKey,
            model: 'gpt-4o-mini',
            temperature: 0.2
          })

    const graphOut = (await compiledGraph.invoke({
      aiMode,
      activeFileContent,
      messages: [new HumanMessage(prompt)]
    })) as { messages: BaseMessage[] }

    const chunks = await model.stream(graphOut.messages as BaseMessage[], {
      signal: abort.signal
    })
    for await (const chunk of chunks) {
      const piece = chunk.content
      if (typeof piece === 'string' && piece.length > 0) {
        safeSend(eventSender, 'ai.streamChunk', { requestId, messageId, chunk: piece })
      } else if (Array.isArray(piece)) {
        const txt = piece
          .map((p) => (typeof p === 'string' ? p : 'text' in p ? String(p.text ?? '') : ''))
          .join('')
        if (txt) {
          safeSend(eventSender, 'ai.streamChunk', { requestId, messageId, chunk: txt })
        }
      }
    }
    safeSend(eventSender, 'ai.streamEnd', { requestId, messageId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    safeSend(eventSender, 'ai.streamError', { requestId, messageId, error: msg })
  } finally {
    activeRequests.delete(requestId)
  }
}

export function setupAIHandlers(): void {
  ipcMain.removeHandler('ai.startStream')
  ipcMain.removeHandler('ai.cancelStream')

  ipcMain.handle('ai.startStream', async (event, payload: StartStreamPayload) => {
    void handleStream(event.sender, payload)
    return { accepted: true as const }
  })

  ipcMain.handle('ai.cancelStream', async (_event, requestId: string) => {
    const ctrl = activeRequests.get(requestId)
    if (ctrl) ctrl.abort()
  })
}
