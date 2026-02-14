const ALLOWED_KEYS = new Set(['description', 'example']);

const noApiProperty = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow usage of @ApiProperty decorators on class properties',
    },
    fixable: 'code',
    schema: [],
    messages: {
      noApiProperty: 'Do not use @ApiProperty decorators on class properties, if you do not add additional info.',
    },
  },
  defaultOptions: [],
  create(context) {
    // Only run on entity and DTO files
    if (
      !context.filename.endsWith('.entity.ts') &&
      !context.filename.endsWith('.dto.ts') &&
      !context.filename.endsWith('.entity.js') &&
      !context.filename.endsWith('.dto.js')
    ) {
      return {};
    }

    return {
      PropertyDefinition(node) {
        if (!node.decorators) return;

        for (const dec of node.decorators) {
          let decoratorName = '';

          // Identify the decorator name (e.g., @ApiProperty or @ApiProperty())
          if (dec.expression.type === 'Identifier') {
            decoratorName = dec.expression.name;
          } else if (
            dec.expression.type === 'CallExpression' &&
            dec.expression.callee.type === 'Identifier'
          ) {
            decoratorName = dec.expression.callee.name;
          }

          if (!decoratorName.startsWith('ApiProperty')) continue;

          // Case 1: @ApiProperty() with no arguments
          if (
            dec.expression.type === 'CallExpression' &&
            dec.expression.arguments.length === 0
          ) {
            context.report({
              node: dec,
              messageId: 'noApiProperty',
              fix(fixer) {
                return fixer.remove(dec);
              },
            });
            continue;
          }

          // Case 2: @ApiProperty({...}) with arguments but no description/example
          if (
            dec.expression.type === 'CallExpression' &&
            dec.expression.arguments.length > 0
          ) {
            const arg = dec.expression.arguments[0];
            if (arg.type === 'ObjectExpression') {
              const hasAllowed = arg.properties.some(
                (prop) =>
                  prop.type === 'Property' &&
                  prop.key.type === 'Identifier' &&
                  ALLOWED_KEYS.has(prop.key.name)
              );

              if (!hasAllowed) {
                context.report({
                  node: dec,
                  messageId: 'noApiProperty',
                  fix(fixer) {
                    return fixer.remove(dec);
                  },
                });
              }
            }
          }
        }
      },
    };
  },
};

export default noApiProperty;