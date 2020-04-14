import visit from 'unist-util-visit';
import qs from 'query-string';

function extractOptions(lang) {
  // Get the index of the first { and last } to extract the options
  const start = lang.indexOf('{');
  const end = lang.lastIndexOf('}');

  if (start !== -1 && end !== -1) {
    return lang.substring(start, end + 1);
  }

  return '';
}

module.exports = function gatsbyRemarkCodeTitles(
  { markdownAST },
  { className: customClassName } = {}
) {
  visit(markdownAST, 'code', (node, index, parent) => {
    // If we have a space in the language string (e.g. `js{numberLines: true}:title=index.js`)
    // the string after the space is going to be set as the `meta` field
    let nodeLang = node.meta ? node.lang + node.meta : node.lang || '';

    // Extract the options between brackets {} (e.g. {numberLines: true}{1,6-10})
    let bracketOptions = extractOptions(nodeLang);

    if (bracketOptions) {
      // Remove the plugin options from the language string
      nodeLang = nodeLang.replace(bracketOptions, '');
    }

    const [language, params] = nodeLang.split(':');
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
    parent.children.splice(index, 0, titleNode);

    /*
     * Reset to just the language
     *
     * If we have a space in the language string (e.g. `js{numberLines: true}:title=index.js`)
     * the meta field will contain the string after the space, we need to clear this field
     * to prevent an inifinte loop caused by `:title` present in `node.meta`
     * See: https://github.com/syntax-tree/mdast#code
     */
    node.lang = language + bracketOptions + newQuery;
    node.meta = null;
  });

  return markdownAST;
};
