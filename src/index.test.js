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

  test(`it adds the title div in the right place for indented code blocks`, () => {
    const title = `hello-world.js`;
    const rest = `clipboard=true`;
    const [original, updated] = setup(`
      1. this is a list with an indented code block
          \`\`\`js:title=${title}&${rest}
          alert('oh shit waddup')
          \`\`\`
    `);
    const [_, titleNode, codeNode] = updated.children[0].children[0].children;

    expect(titleNode.value).toContain(title);
    expect(codeNode.lang).toBe(`js:${rest}`);
  });

  test(`it adds title with spaces`, () => {
    const title = `Java 8 apparently because reasons`;
    const [_, updated] = setup(`
    \`\`\`java:title=${title}
    class HelloWorld {
      public static void main(String args[]) {
        System.out.println("Oh shit waddup!")
      }
    }
    \`\`\`
    `);

    const [titleNode] = updated.children;
    expect(titleNode.value).toContain(title);
  });

  test(`it ignores non-title meta`, () => {
    const meta = `something=true`;
    const [_, updated] = setup(`
      \`\`\`java? ${meta}
        // this is java code
      \`\`\`
    `);

    expect(updated.children).toHaveLength(1);

    const [codeNode] = updated.children;
    expect(codeNode.meta).toBe(meta);
  });
});
