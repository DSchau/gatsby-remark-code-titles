import Remark from 'remark';
import stripIndent from 'strip-indent';
import merge from 'deepmerge';

import codeTitles from './';

const getAST = markdown => {
  const settings = {
    commonmark: true,
    footnotes: true,
    gfm: true,
    pedantic: true,
    tableOfContents: {
      heading: null,
      maxDepth: 6,
    },
  };

  const remark = new Remark().data(`settings`, settings);

  return remark.parse(stripIndent(markdown));
};

const setup = (markdown, options) => {
  const markdownAST = getAST(markdown);

  return [
    markdownAST,
    codeTitles({ markdownAST: merge({}, markdownAST) }, options),
  ];
};

test('it ignores non-code blocks', () => {
  const [original, updated] = setup(`
    # Hello World
  `);

  expect(original).toEqual(updated);
});

test(`it leaves code blocks without language`, () => {
  const [original, updated] = setup(`
    \`\`\`
    var a = 'b'
    \`\`\`
  `);

  expect(original).toEqual(updated);
});

test(`it does not add title without language`, () => {
  const [original, updated] = setup(`
    \`\`\`title=hello-world.js
    alert('hello world')
    \`\`\`
  `);

  expect(original).toEqual(updated);
});

describe(`adding title`, () => {
  test(`it adds title with language`, () => {
    const [original, updated] = setup(`
      \`\`\`js:title=hello-world.js
      alert('hello world')
      \`\`\`
    `);

    expect(original).not.toEqual(updated);

    const [htmlNode] = updated.children;

    expect(htmlNode.type).toBe(`html`);
    expect(htmlNode.value).toBe(
      `<div class="gatsby-code-title">hello-world.js</div>`
    );
  });

  test(`it adds back existing query params`, () => {
    const [original, updated] = setup(`
      \`\`\`js:title=hello-world.js&clipboard=true
      alert('oh shit waddup')
      \`\`\`
    `);

    expect(original).not.toEqual(updated);

    const [_, codeNode] = updated.children;

    expect(codeNode.lang).toBe(`js:clipboard=true`);
  });
});
