import { formatSnippet } from '../formatSnippet';

describe('formatSnippet', () => {
  it('formats JavaScript without changing its statements', () => {
    expect(formatSnippet('const options={enabled:true};', 'js')).toBe(
      'const options = { enabled: true };',
    );
  });

  it('formats CSS rules', () => {
    expect(formatSnippet('p{color:red;margin:0}', 'css')).toBe(
      'p {\n  color: red;\n  margin: 0;\n}',
    );
  });

  it('rejects invalid JavaScript', () => {
    expect(() => formatSnippet('const =', 'js')).toThrow();
  });
});
