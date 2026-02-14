const noPrismaImport = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow importing Prisma in *.service.ts files',
    },
    schema: [
      {
        type: 'object',
        properties: {
          packages: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noPrismaImport: 'Do not import from "{{pkg}}" in service files.',
    },
  },

  create(context) {
    const filename = context.filename;
    // Only run the rule if the file ends in .service.ts
    if (!/\.service\.ts$/i.test(filename)) return {};

    const pkgs = new Set(
      (context.options[0]?.packages ?? ['@prisma/client', 'prisma_client']).map(
        (s) => s.toLowerCase()
      )
    );

    function isBanned(pkg) {
      return typeof pkg === 'string' && pkgs.has(pkg.toLowerCase());
    }

    return {
      // Handles: import ... from 'pkg'
      ImportDeclaration(node) {
        if (isBanned(node.source.value)) {
          context.report({
            node: node.source,
            messageId: 'noPrismaImport',
            data: { pkg: String(node.source.value) },
          });
        }
      },

      // Handles: import('pkg')
      ImportExpression(node) {
        if (
          node.source.type === 'Literal' &&
          isBanned(node.source.value)
        ) {
          context.report({
            node: node.source,
            messageId: 'noPrismaImport',
            data: { pkg: String(node.source.value) },
          });
        }
      },

      // Handles: const x = require('pkg')
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1 &&
          node.arguments[0].type === 'Literal' &&
          isBanned(node.arguments[0].value)
        ) {
          context.report({
            node: node.arguments[0],
            messageId: 'noPrismaImport',
            data: { pkg: String(node.arguments[0].value) },
          });
        }
      },

      // Handles: import x = require('pkg')
      TSImportEqualsDeclaration(node) {
        if (
          node.moduleReference.type === 'TSExternalModuleReference' &&
          node.moduleReference.expression.type === 'Literal' &&
          isBanned(node.moduleReference.expression.value)
        ) {
          context.report({
            node: node.moduleReference.expression,
            messageId: 'noPrismaImport',
            data: { pkg: String(node.moduleReference.expression.value) },
          });
        }
      },
    };
  },
  defaultOptions: [],
};

export default noPrismaImport;