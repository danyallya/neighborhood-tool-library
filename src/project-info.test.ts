import { describe, expect, it } from 'vitest';
import { projectInfo } from './project-info';

describe('Neighborhood Tool Library project contract', () => {
  it('keeps locale and direction aligned', () => {
    expect(projectInfo.slug).toBe('neighborhood-tool-library');
    expect(projectInfo.direction).toBe(projectInfo.locale.startsWith('fa') ? 'rtl' : 'ltr');
    expect(projectInfo.firstTask.length).toBeGreaterThan(8);
  });
});
