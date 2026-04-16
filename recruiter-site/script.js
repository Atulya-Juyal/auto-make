const project = {
  title: 'AutoMake',
  repoUrl: 'https://github.com/Atulya-Juyal/auto-make',
  issuesUrl: 'https://github.com/Atulya-Juyal/auto-make/issues',
  readmeUrl: 'https://github.com/Atulya-Juyal/auto-make#readme',
  releasesUrl: 'https://github.com/Atulya-Juyal/auto-make/releases',
  featureCount: '10+',
  packageCount: '25+',
  processCount: '3',
  stack: [
    'Electron',
    'React',
    'TypeScript',
    'Zustand',
    'Monaco Editor',
    'xterm.js',
    'node-pty',
    'LangGraph',
    'LangChain',
    'Google Gemini',
    'OpenAI',
    'electron-builder'
  ],
  highlights: [
    {
      title: 'Secure Key Management',
      summary:
        'Uses Electron safeStorage in main process to encrypt/decrypt API keys. Keys are never committed to repository files.',
      tags: ['safeStorage', 'Security', 'Electron Main']
    },
    {
      title: 'Real-Time AI Streaming',
      summary:
        'LangGraph orchestration with IPC streaming sends chunked responses into the sidebar with robust end/error events.',
      tags: ['LangGraph', 'Streaming', 'IPC']
    },
    {
      title: 'Professional IDE UX',
      summary:
        'Three-pane resizable layout, recursive explorer tree, Monaco tabs with dirty tracking, and integrated terminal sessions.',
      tags: ['Monaco', 'xterm', 'Resizable Panels']
    }
  ]
}

function byId(id) {
  return document.getElementById(id)
}

function setHref(id, href) {
  const el = byId(id)
  if (!el) return
  el.href = href
}

function buildProjectCard(item) {
  const wrapper = document.createElement('article')
  wrapper.className = 'card'

  const tags = item.tags.map((tag) => `<span class="pill">${tag}</span>`).join('')

  wrapper.innerHTML = `
    <h3>${item.title}</h3>
    <p>${item.summary}</p>
    <div>${tags}</div>
  `
  return wrapper
}

function hydrate() {
  byId('footerYear').textContent = new Date().getFullYear().toString()
  byId('footerName').textContent = project.title
  byId('featureCount').textContent = project.featureCount
  byId('packageCount').textContent = project.packageCount
  byId('processCount').textContent = project.processCount

  setHref('githubTopLink', project.repoUrl)
  setHref('githubMainLink', project.repoUrl)
  setHref('githubCodeLink', project.repoUrl)
  setHref('issuesLink', project.issuesUrl)
  setHref('readmeLink', project.readmeUrl)
  setHref('releasesLink', project.releasesUrl)

  const projectsGrid = byId('projectsGrid')
  project.highlights.forEach((p) => projectsGrid.appendChild(buildProjectCard(p)))

  const skillsWrap = byId('skillsWrap')
  project.stack.forEach((skill) => {
    const chip = document.createElement('span')
    chip.className = 'chip'
    chip.textContent = skill
    skillsWrap.appendChild(chip)
  })
}

hydrate()
