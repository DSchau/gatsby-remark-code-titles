import visit from 'unist-util-visit';
import qs from 'query-string';

module.exports = function gatsbyRemarkCodeTitles(
  { markdownAST },
  { className: customClassName, copy = false } = {}
) {
  visit(markdownAST, 'code', (node, index) => {
    const [language, query] = (node.lang || '').split(':');
    const { title } = qs.parse(query);
    if (!title || !language) {
      return;
    }

    const className = ['gatsby-code-title'].concat(customClassName || []);
    const copyFunction = `(function () { if ('clipboard' in navigator) {navigator.clipboard.writeText('${
      node.value
    }').then(function() {alert('Copied to clipboard')}, function() { alert('Error copying code to clipboard')})}})()`;

    const button = `
      <button type="button" class="gastsby-code-title-copy" alt="Copy to clipboard" onclick="${copyFunction}">
        Copy
      </button>
      `;

    const titleNode = {
      type: 'html',
      value: `
    <div class="${className.join(' ').trim()}">
      ${title}
      ${copy ? button : ''}
    </div>
      `.trim(),
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
