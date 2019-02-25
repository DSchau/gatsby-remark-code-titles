import visit from 'unist-util-visit';
import qs from 'query-string';

module.exports = function gatsbyRemarkCodeTitles(
  { markdownAST },
  { className: customClassName } = {}
) {
  visit(markdownAST, 'code', (node, index) => {
    const [language, params] = (node.lang || '').split(':');
    const options = qs.parse(params);
    const { title, ...rest } = options;
    if (!title || !language) {
      return;
    }

    let newQuery = '';
    if (Object.keys(rest).length) {
      newQuery =
        `:` +
        Object.keys(rest)
          .map(key => `${key}=${rest[key]}`)
          .join('&');
    }

    const className = ['gatsby-code-title'].concat(customClassName || []);

    const titleNode = {
      type: 'html',
      value: `
<div class="${className.join(' ').trim()}">${title}</div>
      `.trim(),
    };

    /*
     * Splice a node back into the Markdown AST with custom title
     */
    markdownAST.children.splice(index, 0, titleNode);

    /*
     * Reset to just the language
     */
    node.lang = language + newQuery;
  });

  return markdownAST;
};
