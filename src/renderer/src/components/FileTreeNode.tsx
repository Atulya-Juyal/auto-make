import { type ReactElement } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { FileNode } from '../store/useAppStore';

export interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
}

export function FileTreeNode({ node, depth }: FileTreeNodeProps): ReactElement {
  const expandedPaths = useAppStore((s) => s.expandedPaths);
  const dirChildren = useAppStore((s) => s.dirChildren);
  const loadingPaths = useAppStore((s) => s.loadingPaths);
  const toggleFolder = useAppStore((s) => s.toggleFolder);
  const openFileInTab = useAppStore((s) => s.openFileInTab);

  const isExpanded = expandedPaths.has(node.path);
  const isLoading = loadingPaths.has(node.path);
  const children = dirChildren[node.path];
  const paddingLeft = 10 + depth * 12;

  const rowBase = {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 6,
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '4px 10px',
    paddingLeft,
    fontSize: '13px' as const,
  };

  const labelTruncate = {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  };

  const iconCell = { flexShrink: 0 as const, lineHeight: 1 };

  if (!node.isDirectory) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => void openFileInTab(node.path)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            void openFileInTab(node.path);
          }
        }}
        style={{
          ...rowBase,
          cursor: 'pointer',
          color: '#fff',
        }}
      >
        <span style={iconCell} aria-hidden>
          📄
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
        onClick={(e) => {
          e.stopPropagation();
          void toggleFolder(node.path);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            void toggleFolder(node.path);
          }
        }}
        style={{
          ...rowBase,
          cursor: 'pointer',
          color: '#aaa',
        }}
      >
        <span style={iconCell} aria-hidden>
          {isExpanded ? '📂' : '📁'}
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
                ...rowBase,
                paddingLeft: paddingLeft + 12,
                color: '#888',
                fontSize: '12px',
              }}
            >
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
