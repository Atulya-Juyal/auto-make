import type { ReactElement } from 'react';

const svgProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  'aria-hidden': true as const,
};

/** Collapsed folder — chevron right */
export function ExplorerChevronRight(): ReactElement {
  return (
    <svg {...svgProps} className="explorer-chevron">
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.22 4.22a.75.75 0 011.06 0l3.5 3.5a.75.75 0 010 1.06l-3.5 3.5a.75.75 0 11-1.06-1.06L9.19 8 6.22 5.03a.75.75 0 010-1.06z"
      />
    </svg>
  );
}

const CHEVRON_DOWN_D =
  'M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z';

/** Expanded folder — chevron down */
export function ExplorerChevronDown(): ReactElement {
  return (
    <svg {...svgProps} className="explorer-chevron">
      <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d={CHEVRON_DOWN_D} />
    </svg>
  );
}

/** Same glyph as folder chevron down, rotated — for terminal expand (point up). */
export function ExplorerChevronUp(): ReactElement {
  return (
    <svg {...svgProps} className="explorer-chevron">
      <g transform="rotate(180 8 8)">
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d={CHEVRON_DOWN_D} />
      </g>
    </svg>
  );
}

function baseNameOf(fileName: string): string {
  return fileName.split(/[/\\]/).pop() ?? fileName;
}

/** Extension of the basename; empty for dotfiles like `.gitignore` (no real suffix). */
function extOf(fileName: string): string {
  const base = baseNameOf(fileName);
  const i = base.lastIndexOf('.');
  if (i <= 0) return '';
  return base.slice(i + 1).toLowerCase();
}

type GlyphKind = 'json' | 'css' | 'html' | 'md' | 'image' | 'config';

/** [label, background, foreground?] — default fg white */
type BadgeSpec = readonly [string, string, string?];

function IconWrap({
  className,
  children,
}: {
  className: string;
  children: ReactElement;
}): ReactElement {
  return (
    <span className={`explorer-file-icon ${className}`} style={{ lineHeight: 0, display: 'inline-flex' }}>
      {children}
    </span>
  );
}

function ColoredBadge({ letter, bg, fg = '#ffffff' }: { letter: string; bg: string; fg?: string }): ReactElement {
  const len = letter.length;
  const fontSize = len > 4 ? 4.5 : len > 3 ? 5 : len > 2 ? 5.5 : 6.5;
  return (
    <IconWrap className="explorer-file-generic">
      <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden>
        <rect x={1.5} y={2.5} width={13} height={11} rx={2} fill={bg} />
        <text
          x={8}
          y={9.5}
          dominantBaseline="middle"
          textAnchor="middle"
          fill={fg}
          fontSize={fontSize}
          fontWeight={600}
          fontFamily="system-ui, Segoe UI, sans-serif"
        >
          {letter}
        </text>
      </svg>
    </IconWrap>
  );
}

function GenericFile(): ReactElement {
  return (
    <IconWrap className="explorer-file-generic">
      <svg {...svgProps}>
        <path
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4 1.75A.75.75 0 014.75 1h5.5c.2 0 .39.08.53.22l2.5 2.5c.14.14.22.33.22.53v10a.75.75 0 01-.75.75h-8.5A.75.75 0 013 14.25V2.5c0-.2.08-.39.22-.53l.78-.22zM5 2.5v11h7.5v-9h-2A.75.75 0 019 3.75V2.5H5zm4.25-.19v1.44h1.44L9.25 2.31z"
        />
      </svg>
    </IconWrap>
  );
}

function ReactIcon(): ReactElement {
  return (
    <IconWrap className="explorer-file-react">
      <svg {...svgProps}>
        <circle cx={8} cy={8} r={1.35} fill="#61dafb" />
        <ellipse cx={8} cy={8} rx={5.8} ry={2.35} fill="none" stroke="#61dafb" strokeWidth={0.85} />
        <ellipse
          cx={8}
          cy={8}
          rx={5.8}
          ry={2.35}
          fill="none"
          stroke="#61dafb"
          strokeWidth={0.85}
          transform="rotate(60 8 8)"
        />
        <ellipse
          cx={8}
          cy={8}
          rx={5.8}
          ry={2.35}
          fill="none"
          stroke="#61dafb"
          strokeWidth={0.85}
          transform="rotate(-60 8 8)"
        />
      </svg>
    </IconWrap>
  );
}

function JsonIcon(): ReactElement {
  return (
    <IconWrap className="explorer-file-json">
      <svg {...svgProps}>
        <path
          fill="currentColor"
          d="M4 2v1.2h.8v5.6H4V10h2.5V8.8H5.6V3.2h.8V2H4zm7.5 0v1.2h.8v5.6h-.8V10H14V8.8h-.8V3.2h.8V2h-2.5zM7 5h1v1H7V5zm2.5 0H11v1H9.5V5zM7 7h1v1H7V7zm2.5 0H11v1H9.5V7zM7 9h1v1H7V9zm2.5 0H11v1H9.5V9z"
        />
      </svg>
    </IconWrap>
  );
}

function CssIcon(): ReactElement {
  return (
    <IconWrap className="explorer-file-css">
      <svg {...svgProps}>
        <path
          fill="currentColor"
          d="M3 2l.65 11.5L8 15l4.35-1.5L13 2H3zm8.2 2.4l-.12 1.35H6.5l.08.95h4.35l-.4 4.55-2.43.65-2.43-.65-.18-1.75h1.2l.1.75 1.33.35 1.33-.35.14-1.55H5.35l-.32-3.6h6.55L11.2 4.4z"
        />
      </svg>
    </IconWrap>
  );
}

function HtmlIcon(): ReactElement {
  return (
    <IconWrap className="explorer-file-html">
      <svg {...svgProps}>
        <path
          fill="currentColor"
          d="M3.2 2 2 12.5h1.05l.22-1.85h5.46l.22 1.85H10L8.8 2H3.2zm1 2.1h4.6l.35 3.15H4.85l.35-3.15z"
        />
      </svg>
    </IconWrap>
  );
}

function MarkdownIcon(): ReactElement {
  return (
    <IconWrap className="explorer-file-md">
      <svg {...svgProps}>
        <path
          fill="currentColor"
          d="M3 3h10v10H3V3zm1 1v8h8V4H4zm1 1h2v2.5H5V5zm3.5 0H12v1H8.5V5zm-3.5 3h2V12H5V8zm3.5 0H12v2H8.5V8zm0 3H12v1H8.5v-1z"
        />
      </svg>
    </IconWrap>
  );
}

function ImageIcon(): ReactElement {
  return (
    <IconWrap className="explorer-file-image">
      <svg {...svgProps}>
        <path
          fill="currentColor"
          d="M3 3h10v10H3V3zm1 1v6.2l1.8-1.8 1.8 1.8 1.5-1.5 2.9 2.9V4H4zm7.2 1.3a.9.9 0 100-1.8.9.9 0 000 1.8z"
        />
      </svg>
    </IconWrap>
  );
}

function ConfigIcon(): ReactElement {
  return (
    <IconWrap className="explorer-file-config">
      <svg {...svgProps} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round">
        <circle cx={8} cy={8} r={2.2} />
        <path d="M8 2v1.4M8 12.6V14M2 8h1.4M12.6 8H14M3.5 3.5l1 1M11.5 11.5l1 1M12.5 3.5l-1 1M4.5 11.5l-1 1" />
      </svg>
    </IconWrap>
  );
}

function renderGlyph(kind: GlyphKind): ReactElement {
  switch (kind) {
    case 'json':
      return <JsonIcon />;
    case 'css':
      return <CssIcon />;
    case 'html':
      return <HtmlIcon />;
    case 'md':
      return <MarkdownIcon />;
    case 'image':
      return <ImageIcon />;
    default:
      return <ConfigIcon />;
  }
}

/**
 * Shared glyphs (JSON/CSS/HTML/MD/image/gear) — typical IDE “category” icons.
 * Everything else maps to a ColoredBadge in EXT_BADGE.
 */
const EXT_GLYPH: Record<string, GlyphKind> = {
  json: 'json',
  jsonc: 'json',
  json5: 'json',
  webmanifest: 'json',
  'code-workspace': 'json',
  'code-snippets': 'json',
  css: 'css',
  scss: 'css',
  sass: 'css',
  less: 'css',
  styl: 'css',
  stylus: 'css',
  pcss: 'css',
  html: 'html',
  htm: 'html',
  xhtml: 'html',
  md: 'md',
  mdx: 'md',
  markdown: 'md',
  rmd: 'md',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  ico: 'image',
  bmp: 'image',
  tif: 'image',
  tiff: 'image',
  avif: 'image',
  heic: 'image',
  icns: 'image',
  woff: 'image',
  woff2: 'image',
  ttf: 'image',
  otf: 'image',
  eot: 'image',
  yml: 'config',
  yaml: 'config',
  toml: 'config',
  ini: 'config',
  cfg: 'config',
  conf: 'config',
  config: 'config',
  properties: 'config',
  env: 'config',
  editorconfig: 'config',
  gitattributes: 'config',
  gitmodules: 'config',
  dockerignore: 'config',
};

const EXT_BADGE: Record<string, BadgeSpec> = {
  ts: ['TS', '#3178c6'],
  mts: ['TS', '#3178c6'],
  cts: ['TS', '#3178c6'],
  js: ['JS', '#f0db4f', '#323330'],
  mjs: ['JS', '#f0db4f', '#323330'],
  cjs: ['JS', '#f0db4f', '#323330'],
  jsx: ['JSX', '#61dafb', '#202020'],
  vue: ['VUE', '#41b883'],
  svelte: ['SV', '#ff3e00'],
  astro: ['A', '#ff5d01'],
  angular: ['NG', '#dd0031'],

  py: ['PY', '#3776ab'],
  pyw: ['PY', '#3776ab'],
  pyi: ['PY', '#3776ab'],
  ipynb: ['NB', '#f37626'],

  rb: ['RB', '#cc342d'],
  rake: ['RB', '#cc342d'],
  gemspec: ['RB', '#cc342d'],
  erb: ['ERB', '#cc342d'],

  php: ['PHP', '#777bb4'],
  phtml: ['PHP', '#777bb4'],

  java: ['JA', '#ca3132'],
  kt: ['KT', '#7f52ff'],
  kts: ['KT', '#7f52ff'],
  scala: ['SC', '#dc322f'],
  sc: ['SC', '#dc322f'],
  swift: ['SW', '#f05138'],
  dart: ['DT', '#0175c2'],

  go: ['GO', '#00add8'],
  mod: ['GO', '#00add8'],
  sum: ['GO', '#5c5c5c'],

  rs: ['RS', '#dea584', '#1a1a1a'],

  c: ['C', '#555555'],
  h: ['H', '#659ad2'],
  cpp: ['C++', '#659ad2'],
  cxx: ['C++', '#659ad2'],
  cc: ['C++', '#659ad2'],
  hpp: ['H+', '#659ad2'],
  hh: ['H+', '#659ad2'],
  hxx: ['H+', '#659ad2'],
  inl: ['C++', '#659ad2'],
  cu: ['CU', '#76b900'],
  cuda: ['CU', '#76b900'],

  cs: ['C#', '#239120'],
  csx: ['C#', '#239120'],
  csproj: ['C#', '#239120'],
  vbproj: ['VB', '#945db7'],
  fsproj: ['FS', '#378bba'],
  sln: ['SLN', '#68217a'],
  vb: ['VB', '#945db7'],
  fs: ['FS', '#378bba'],
  fsi: ['FS', '#378bba'],
  fsx: ['FS', '#378bba'],
  fsscript: ['FS', '#378bba'],

  m: ['OC', '#438eff'],
  mm: ['OC', '#438eff'],

  pl: ['PL', '#39457e'],
  pm: ['PL', '#39457e'],
  t: ['PL', '#39457e'],

  lua: ['LUA', '#000080'],
  r: ['R', '#276dc3'],
  jl: ['JL', '#9558b2'],
  ex: ['EX', '#6e4a7e'],
  exs: ['EX', '#6e4a7e'],
  erl: ['ER', '#a2003e'],
  hrl: ['ER', '#a2003e'],
  clj: ['CL', '#5881d8'],
  cljs: ['CL', '#5881d8'],
  cljc: ['CL', '#5881d8'],
  edn: ['EDN', '#5881d8'],
  elm: ['ELM', '#1293d8'],
  hs: ['HS', '#5d4f85'],
  lhs: ['HS', '#5d4f85'],
  ml: ['ML', '#e37933'],
  mli: ['ML', '#e37933'],
  nim: ['NIM', '#ffc200', '#1a1a1a'],
  zig: ['ZG', '#f7a41d', '#1a1a1a'],
  v: ['V', '#4f87c4'],
  cr: ['CR', '#000000'],
  nix: ['NIX', '#5277c3'],
  d: ['D', '#b03931'],
  groovy: ['GV', '#4298b8'],
  gvy: ['GV', '#4298b8'],
  gradle: ['GR', '#02303a'],
  tf: ['TF', '#7b42bc'],
  tfvars: ['TF', '#7b42bc'],
  hcl: ['HC', '#844fba'],

  sh: ['SH', '#89e051'],
  bash: ['SH', '#89e051'],
  zsh: ['SH', '#89e051'],
  fish: ['FSH', '#4a4ae9'],
  ksh: ['SH', '#89e051'],
  ps1: ['PS', '#5391fe'],
  psm1: ['PS', '#5391fe'],
  psd1: ['PS', '#5391fe'],
  pssc: ['PS', '#5391fe'],
  bat: ['BAT', '#c1f12e', '#1a1a1a'],
  cmd: ['CMD', '#c1f12e', '#1a1a1a'],

  sql: ['SQL', '#336791'],
  mysql: ['SQL', '#00758f'],
  sqlite: ['SQL', '#003b57'],
  graphql: ['GQL', '#e10098'],
  gql: ['GQL', '#e10098'],

  xml: ['XML', '#b06504'],
  xsd: ['XSD', '#b06504'],
  xslt: ['XSL', '#8b4a9c'],
  plist: ['PL', '#8b8b8b'],
  rss: ['RSS', '#ee802f'],
  atom: ['AT', '#f26522'],

  csv: ['CSV', '#217346'],
  tsv: ['TSV', '#217346'],
  xls: ['XLS', '#217346'],
  xlsx: ['XLS', '#217346'],
  xlsm: ['XLS', '#217346'],
  ods: ['ODS', '#34a853'],

  pdf: ['PDF', '#b30b00'],
  doc: ['DOC', '#2b579a'],
  docx: ['DOC', '#2b579a'],
  odt: ['ODT', '#188038'],

  ppt: ['PPT', '#d24726'],
  pptx: ['PPT', '#d24726'],

  zip: ['ZIP', '#eab308', '#1a1a1a'],
  tar: ['TAR', '#ca8a04', '#1a1a1a'],
  gz: ['GZ', '#ca8a04', '#1a1a1a'],
  tgz: ['TGZ', '#ca8a04', '#1a1a1a'],
  bz2: ['BZ2', '#ca8a04', '#1a1a1a'],
  xz: ['XZ', '#ca8a04', '#1a1a1a'],
  '7z': ['7Z', '#eab308', '#1a1a1a'],
  rar: ['RAR', '#a78bfa'],
  lz: ['LZ', '#94a3b8'],

  mp4: ['MP4', '#7c3aed'],
  webm: ['WEB', '#7c3aed'],
  mov: ['MOV', '#7c3aed'],
  mkv: ['MKV', '#7c3aed'],
  avi: ['AVI', '#7c3aed'],

  mp3: ['MP3', '#0ea5e9'],
  wav: ['WAV', '#0ea5e9'],
  ogg: ['OGG', '#0ea5e9'],
  flac: ['FL', '#0ea5e9'],
  m4a: ['M4A', '#0ea5e9'],

  wasm: ['WA', '#654ff0'],
  wat: ['WA', '#654ff0'],

  prisma: ['PR', '#2d3748'],
  proto: ['PB', '#244c5a'],
  thrift: ['TH', '#294999'],
  avsc: ['AV', '#b08800'],

  sol: ['SOL', '#65adf1'],
  vy: ['VY', '#9f6bff'],

  tex: ['TEX', '#3d6117'],
  latex: ['TEX', '#3d6117'],
  bib: ['BIB', '#800000'],

  rst: ['RST', '#141414'],
  adoc: ['AD', '#e40046'],

  pug: ['PUG', '#a86454'],
  jade: ['PUG', '#a86454'],
  hbs: ['HB', '#f0772b'],
  ejs: ['EJS', '#a91e50'],
  njk: ['NJ', '#3d8137'],
  liquid: ['LIQ', '#4ea819'],
  mustache: ['MU', '#e37933'],
  slim: ['SL', '#2b2b2b'],

  coffee: ['COF', '#28334c'],
  litcoffee: ['COF', '#28334c'],

  cl: ['CL', '#ed2e2e'],
  cljsbuild: ['CL', '#ed2e2e'],

  pas: ['PAS', '#e3e3e3', '#1a1a1a'],
  pp: ['PAS', '#e3e3e3', '#1a1a1a'],

  asm: ['ASM', '#000000'],
  s: ['ASM', '#000000'],
  S: ['ASM', '#000000'],
  nasm: ['ASM', '#000000'],

  ll: ['LLVM', '#5a87d5'],
  bc: ['LLVM', '#5a87d5'],

  f90: ['FT', '#4d41b1'],
  f95: ['FT', '#4d41b1'],
  f03: ['FT', '#4d41b1'],
  f08: ['FT', '#4d41b1'],
  f: ['FT', '#4d41b1'],
  for: ['FT', '#4d41b1'],

  cbl: ['CBL', '#005ca9'],
  cob: ['CBL', '#005ca9'],

  vuei18n: ['I18', '#42b883'],

  patch: ['DIFF', '#6b7280'],
  diff: ['DIFF', '#6b7280'],

  log: ['LOG', '#6b7280'],
  lock: ['LOCK', '#6b7280'],

  pem: ['KEY', '#f59e0b'],
  crt: ['KEY', '#f59e0b'],
  cer: ['KEY', '#f59e0b'],
  key: ['KEY', '#f59e0b'],
  p12: ['KEY', '#f59e0b'],
  pfx: ['KEY', '#f59e0b'],
  csr: ['KEY', '#f59e0b'],
  gpg: ['GPG', '#335599'],
  asc: ['GPG', '#335599'],

  exe: ['BIN', '#64748b'],
  dll: ['BIN', '#64748b'],
  so: ['BIN', '#64748b'],
  dylib: ['BIN', '#64748b'],
  bin: ['BIN', '#64748b'],
  dat: ['BIN', '#64748b'],
  o: ['BIN', '#64748b'],
  a: ['BIN', '#64748b'],
  lib: ['LIB', '#64748b'],
  pdb: ['BIN', '#64748b'],
  obj: ['BIN', '#64748b'],
  class: ['CLS', '#ca3132'],
  jar: ['JAR', '#ca3132'],

  vuex: ['VX', '#41b883'],

  rkt: ['RK', '#9f1d20'],
  scm: ['SCM', '#e30033'],
  ss: ['SCM', '#e30033'],

  vhd: ['VH', '#113d68'],
  vhdl: ['VH', '#113d68'],
  sv: ['SV', '#b15606'],
  svh: ['SV', '#b15606'],

  awk: ['AWK', '#c30e9c'],
  sed: ['SED', '#4b3f91'],

  cmake: ['CM', '#064f8c'],
  mak: ['MK', '#427819'],

  re: ['RE', '#dd4b39'],
  rei: ['RE', '#dd4b39'],
  res: ['RES', '#e6484f'],
  resi: ['RES', '#e6484f'],
  purs: ['PS', '#14161a'],

  bazel: ['BZ', '#43a047'],
  bzl: ['BZ', '#43a047'],
  buck: ['BK', '#4a69bd'],
  gn: ['GN', '#6f4e37'],
  ninja: ['NJ', '#76b900'],

  tfstate: ['TF', '#7b42bc'],
  tfstatebackup: ['TF', '#7b42bc'],

  containerfile: ['DK', '#2496ed'],

  http: ['HTTP', '#005c9c'],
  rest: ['API', '#6b7280'],

  drawio: ['DIO', '#f08705'],
  dia: ['DIA', '#c5c5c5'],

  feature: ['BDD', '#5ecf8b'],
  story: ['ST', '#ff6b6b'],
};

function basenameIcon(base: string): ReactElement | null {
  const lower = base.toLowerCase();
  if (lower === 'dockerfile' || lower.startsWith('dockerfile.')) {
    return <ColoredBadge letter="DK" bg="#2496ed" />;
  }
  if (lower === 'containerfile' || lower.startsWith('containerfile.')) {
    return <ColoredBadge letter="DK" bg="#2496ed" />;
  }
  if (lower === 'makefile' || lower === 'gnumakefile') {
    return <ColoredBadge letter="MK" bg="#427819" />;
  }
  if (lower === 'cmakelists.txt') {
    return <ColoredBadge letter="CM" bg="#064f8c" />;
  }
  if (lower === 'vagrantfile') {
    return <ColoredBadge letter="VG" bg="#1563ff" />;
  }
  if (lower === 'jenkinsfile') {
    return <ColoredBadge letter="JK" bg="#d24939" />;
  }
  if (lower === 'rakefile' || lower === 'gemfile' || lower === 'gemfile.lock') {
    return <ColoredBadge letter="RB" bg="#cc342d" />;
  }
  if (lower === 'procfile' || lower.startsWith('procfile')) {
    return <ColoredBadge letter="PF" bg="#6b4fd6" />;
  }
  if (lower === '.editorconfig') {
    return <ConfigIcon />;
  }
  if (
    lower === '.gitignore' ||
    lower === '.gitattributes' ||
    lower === '.dockerignore' ||
    lower === '.npmignore' ||
    lower === '.npmrc' ||
    lower === '.yarnrc' ||
    lower === '.yarnrc.yml' ||
    lower === '.nvmrc' ||
    lower === '.node-version' ||
    lower === '.ruby-version' ||
    lower === '.python-version' ||
    lower === '.tool-versions'
  ) {
    return <ConfigIcon />;
  }
  if (lower === '.env' || lower.startsWith('.env.')) {
    return <ConfigIcon />;
  }
  if (lower.startsWith('tsconfig') && lower.endsWith('.json')) {
    return <JsonIcon />;
  }
  if (lower === 'package.json' || lower === 'package-lock.json' || lower === 'pnpm-lock.yaml' || lower === 'yarn.lock') {
    return lower.endsWith('.json') || lower.endsWith('.yaml') ? renderGlyph(lower.endsWith('.json') ? 'json' : 'config') : <ConfigIcon />;
  }
  if (lower === 'composer.json' || lower === 'composer.lock') {
    return lower.endsWith('.json') ? <JsonIcon /> : <ConfigIcon />;
  }
  if (lower.startsWith('vite.config') || lower.startsWith('vitest.config')) {
    return <ColoredBadge letter="VT" bg="#646cff" />;
  }
  if (lower.startsWith('webpack.config')) {
    return <ColoredBadge letter="WP" bg="#8ed6fb" fg="#1a1a1a" />;
  }
  if (lower.startsWith('rollup.config')) {
    return <ColoredBadge letter="RL" bg="#ec4a3f" />;
  }
  if (lower.startsWith('eslint.config') || lower.startsWith('.eslintrc')) {
    return <ColoredBadge letter="ES" bg="#4b32c3" />;
  }
  if (lower.startsWith('prettier') && (lower.endsWith('.json') || lower.endsWith('.yaml') || lower.endsWith('.yml'))) {
    return renderGlyph(lower.endsWith('.json') ? 'json' : 'config');
  }
  if (lower === 'tailwind.config.js' || lower === 'tailwind.config.ts' || lower.startsWith('tailwind.config.')) {
    return <ColoredBadge letter="TW" bg="#06b6d4" />;
  }
  if (lower.startsWith('next.config')) {
    return <ColoredBadge letter="NX" bg="#000000" />;
  }
  if (lower.startsWith('nuxt.config')) {
    return <ColoredBadge letter="NX" bg="#00dc82" fg="#1a1a1a" />;
  }
  if (lower.startsWith('svelte.config')) {
    return <ColoredBadge letter="SV" bg="#ff3e01" />;
  }
  if (lower.startsWith('astro.config')) {
    return <ColoredBadge letter="A" bg="#ff5d01" />;
  }
  return null;
}

export function ExplorerFileIcon({ fileName }: { fileName: string }): ReactElement {
  const base = baseNameOf(fileName);
  const ext = extOf(fileName);

  const fromBase = basenameIcon(base);
  if (fromBase) return fromBase;

  if (ext === 'tsx') {
    return <ReactIcon />;
  }

  const glyph = EXT_GLYPH[ext];
  if (glyph) {
    return renderGlyph(glyph);
  }

  const badge = EXT_BADGE[ext];
  if (badge) {
    const [letter, bg, fg] = badge;
    return <ColoredBadge letter={letter} bg={bg} fg={fg} />;
  }

  if (
    base === 'package.json' ||
    base.startsWith('tsconfig') ||
    base === '.eslintrc' ||
    base === '.eslintrc.json' ||
    base === '.gitignore' ||
    base === '.env'
  ) {
    return <ConfigIcon />;
  }

  return <GenericFile />;
}
