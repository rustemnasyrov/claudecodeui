import assert from 'node:assert/strict';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, test, vi } from 'vitest';

import type { Project } from '@/shared/types';

/**
 * The header toggle re-requests the tree with ignored entries included, shows
 * them de-emphasized, and remembers the choice for the next visit.
 */

const ROOT = '/home/dev/app';

const leanTree = [
  { type: 'file', name: 'index.ts', path: `${ROOT}/index.ts` },
];

const fullTree = [
  { type: 'directory', name: 'dist', path: `${ROOT}/dist`, isIgnored: true, children: [] },
  { type: 'file', name: 'index.ts', path: `${ROOT}/index.ts` },
];

const getFiles = vi.fn(async (
  _projectId: string,
  _options?: unknown,
  listing?: { includeIgnored?: boolean },
) => ({
  ok: true,
  json: async () => (listing?.includeIgnored ? fullTree : leanTree),
}));

vi.mock('@/shared/api', () => ({
  api: {
    getFiles: (...args: Parameters<typeof getFiles>) => getFiles(...args),
  },
}));

const { default: FileTree } = await import('@/modules/file-tree/FileTree');

const project: Project = { projectId: 'p1', displayName: 'app', fullPath: ROOT, path: ROOT };

beforeEach(() => {
  localStorage.clear();
  getFiles.mockClear();
});

afterEach(() => {
  localStorage.clear();
});

test('the toggle lists git-ignored entries de-emphasized and remembers the choice', async () => {
  const { unmount } = render(<FileTree selectedProject={project} />);

  await waitFor(() => assert.ok(screen.getByText('index.ts')));
  assert.equal(screen.queryByText('dist'), null);
  assert.equal(getFiles.mock.calls[0]?.[2]?.includeIgnored, false);

  fireEvent.click(screen.getByRole('button', { name: 'Show git-ignored files' }));

  await waitFor(() => assert.ok(screen.getByText('dist')));
  assert.equal(getFiles.mock.calls.at(-1)?.[2]?.includeIgnored, true);
  // The ignored row is dimmed; ordinary rows are not.
  assert.match(screen.getByText('dist').closest('.group')?.className ?? '', /opacity-50/);
  assert.doesNotMatch(screen.getByText('index.ts').closest('.group')?.className ?? '', /opacity-50/);
  assert.equal(
    screen.getByRole('button', { name: 'Show git-ignored files' }).getAttribute('aria-pressed'),
    'true',
  );

  unmount();
  getFiles.mockClear();
  render(<FileTree selectedProject={project} />);

  await waitFor(() => assert.ok(screen.getByText('dist')));
  assert.equal(getFiles.mock.calls[0]?.[2]?.includeIgnored, true);
});
