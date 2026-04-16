const profile = {
  name: 'Your Name',
  githubUrl: 'https://github.com/Atulya-Juyal',
  linkedinUrl: 'https://www.linkedin.com/in/atulya-juyal-86a1a528a/',
  resumeUrl: 'https://your-resume-link.com',
  email: 'your.email@example.com',
  yearsExp: '2+',
  projectsCount: '12+',
  techCount: '20+',
  skills: [
    'TypeScript',
    'JavaScript',
    'React',
    'Node.js',
    'Electron',
    'Python',
    'MongoDB',
    'PostgreSQL',
    'REST APIs',
    'GitHub Actions',
    'Docker',
    'System Design'
  ],
  featuredProjects: [
    {
      title: 'AutoMake Desktop IDE',
      summary:
        'Electron IDE with secure API key storage, Monaco editor, integrated terminal, and real-time AI chat streaming.',
      repo: 'https://github.com/your-username/automake',
      demo: '',
      tags: ['Electron', 'React', 'TypeScript', 'LangGraph']
    },
    {
      title: 'Project Two',
      summary:
        'Describe your strongest backend/full-stack project here with impact metrics and technical depth.',
      repo: 'https://github.com/your-username/project-two',
      demo: '',
      tags: ['Node.js', 'Express', 'MongoDB']
    },
    {
      title: 'Project Three',
      summary:
        'Describe another recruiter-relevant project (scalability, UX polish, deployment, performance, testing).',
      repo: 'https://github.com/your-username/project-three',
      demo: '',
      tags: ['React', 'API', 'Testing']
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

function buildProjectCard(project) {
  const wrapper = document.createElement('article')
  wrapper.className = 'card'

  const tags = project.tags.map((tag) => `<span class="pill">${tag}</span>`).join('')
  const demoLink = project.demo
    ? `<a class="pill" href="${project.demo}" target="_blank" rel="noreferrer">Live Demo</a>`
    : ''

  wrapper.innerHTML = `
    <h3>${project.title}</h3>
    <p>${project.summary}</p>
    <div>${tags}</div>
    <div class="card-links">
      <a class="pill" href="${project.repo}" target="_blank" rel="noreferrer">GitHub Repo</a>
      ${demoLink}
    </div>
  `
  return wrapper
}

function hydrate() {
  byId('footerYear').textContent = new Date().getFullYear().toString()
  byId('footerName').textContent = profile.name
  byId('yearsExp').textContent = profile.yearsExp
  byId('projectsCount').textContent = profile.projectsCount
  byId('techCount').textContent = profile.techCount

  setHref('githubTopLink', profile.githubUrl)
  setHref('githubMainLink', profile.githubUrl)
  setHref('githubProjectsLink', profile.githubUrl)
  setHref('resumeLink', profile.resumeUrl)
  setHref('linkedinLink', profile.linkedinUrl)
  setHref('emailLink', `mailto:${profile.email}`)

  const projectsGrid = byId('projectsGrid')
  profile.featuredProjects.forEach((p) => projectsGrid.appendChild(buildProjectCard(p)))

  const skillsWrap = byId('skillsWrap')
  profile.skills.forEach((skill) => {
    const chip = document.createElement('span')
    chip.className = 'chip'
    chip.textContent = skill
    skillsWrap.appendChild(chip)
  })
}

hydrate()
