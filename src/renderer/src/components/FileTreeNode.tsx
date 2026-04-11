import { type ReactElement } from 'react';
import {
  ExplorerChevronDown,
  ExplorerChevronRight,
  ExplorerFileIcon,
} from './explorer/ExplorerIcons';
import { useAppStore } from '../store/useAppStore';
import type { FileNode } from '../store/useAppStore';

export interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
}

const leadCol = {
  width: 16,
  minWidth: 16,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

export function FileTreeNode({ node, depth }: FileTreeNodeProps): ReactElement {
  const expandedPaths = useAppStore((s) => s.expandedPaths);
  const dirChildren = useAppStore((s) => s.dirChildren);
  const loadingPaths = useAppStore((s) => s.loadingPaths);
  const explorerSelectedPath = useAppStore((s) => s.explorerSelectedPath);
  const explorerPaneFocused = useAppStore((s) => s.explorerPaneFocused);
  const setExplorerSelectedPath = useAppStore((s) => s.setExplorerSelectedPath);
  const toggleFolder = useAppStore((s) => s.toggleFolder);
  const openFileInTab = useAppStore((s) => s.openFileInTab);

  const isExpanded = expandedPaths.has(node.path);
  const isLoading = loadingPaths.has(node.path);
  const children = dirChildren[node.path];
  const paddingLeft = 10 + depth * 12;
  const selected = explorerSelectedPath === node.path;
  const selectedMod = selected
    ? explorerPaneFocused
      ? 'explorer-row--selected-active'
      : 'explorer-row--selected-inactive'
    : '';

  const rowClass = [
    'explorer-row',
    node.isDirectory ? 'explorer-row--folder' : 'explorer-row--file',
    selectedMod,
  ]
    .filter(Boolean)
    .join(' ');

  const rowStyle = {
    paddingLeft,
  };

  const labelTruncate = {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  };

  if (!node.isDirectory) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={rowClass}
        style={rowStyle}
        data-explorer-row
        data-path={node.path}
        onFocus={() => setExplorerSelectedPath(node.path)}
        onClick={() => void openFileInTab(node.path)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            void openFileInTab(node.path);
          }
        }}
      >
        <span style={leadCol} aria-hidden>
          <ExplorerFileIcon fileName={node.name} />
        </span>
        <span style={labelTruncate} title={node.name}>
          {node.name}
        </span>
      </div>
    );
  }

  return (
    <div style={{ minWidth: 0 }}>
      <div
        role="button"
        tabIndex={0}
        className={rowClass}
        style={rowStyle}
        data-explorer-row
        data-path={node.path}
        onFocus={() => setExplorerSelectedPath(node.path)}
        onClick={() => {
          void toggleFolder(node.path);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            void toggleFolder(node.path);
          }
        }}
      >
        <span style={leadCol} aria-hidden>
          {isExpanded ? <ExplorerChevronDown /> : <ExplorerChevronRight />}
        </span>
        <span style={labelTruncate} title={node.name}>
          {node.name}
        </span>
      </div>
      {isExpanded && (
        <div style={{ minWidth: 0 }}>
          {isLoading && children === undefined ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                minWidth: 0,
                width: '100%',
                boxSizing: 'border-box',
                padding: '4px 10px',
                paddingLeft: paddingLeft + 6,
                color: '#888',
                fontSize: '12px',
              }}
            >
              <span style={leadCol} aria-hidden />
              <span style={labelTruncate}>Loading…</span>
            </div>
          ) : null}
          {children?.map((child) => (
            <FileTreeNode key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
