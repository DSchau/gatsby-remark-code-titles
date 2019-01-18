import visit from 'unist-util-visit';
import qs from 'query-string';

module.exports = function gatsbyRemarkCodeTitles(
  { markdownAST },
  { className: customClassName }
) {
  visit(markdownAST, 'code', (node, index) => {
    const [language, ...params] = (node.lang || '').split(':');
    const query = params.join('&');
    const options = qs.parse(query);
    const title = options.title;
    if (!title || !language) {
      return;
    }

    delete options['title'];
    let newQuery = '';
    for (let key in options) {
      newQuery += `:${key}=${options[key]}`;
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
};
