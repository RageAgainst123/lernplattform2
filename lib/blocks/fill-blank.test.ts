import { describe, expect, it } from 'vitest';
import { parseFillText } from '@/lib/blocks/fill-blank';

describe('parseFillText', () => {
  it('splits text and placeholders in order', () => {
    expect(parseFillText('Ein {0} ist ein {1}.')).toEqual(['Ein ', 0, ' ist ein ', 1, '.']);
  });

  it('handles a placeholder at the start', () => {
    expect(parseFillText('{0} ist wichtig')).toEqual([0, ' ist wichtig']);
  });

  it('handles text without placeholders', () => {
    expect(parseFillText('nur Text')).toEqual(['nur Text']);
  });
});
