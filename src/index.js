import visit from 'unist-util-visit';
import qs from 'query-string';

module.exports = function gatsbyRemarkCodeTitles({ markdownAST }, { className: customClassName }) {
  visit(markdownAST, 'code', (node, index) => {
    const [language, query] = (node.lang || '').split(':');
    const { title } = qs.parse(query);
    if (!title || !language) {
      return;
    }

    const className = ['gatsby-code-title'].concat(customClassName || []);

    const titleNode = {
      type: 'html',
      value: `
<div class="${className.join(' ').trim()}">${title}</div>
      `.trim()
    };

    /*
     * Splice a node back into the Markdown AST with custom title
     */
    markdownAST.children.splice(index, 0, titleNode);

    /*
     * Reset to just the language
     */
    node.lang = language;
  });
};
