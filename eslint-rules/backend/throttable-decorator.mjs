const ROUTE_DECORATORS = new Set([
  'Get',
  'Post',
  'Put',
  'Patch', // maybe in the future
  'Delete',
]);

function getDecoratorName(dec) {
    if (dec.expression.type === 'Identifier') {
    return dec.expression.name;
    }

    if (
    dec.expression.type === 'CallExpression' &&
    dec.expression.callee.type === 'Identifier'
    ) {
    return dec.expression.callee.name;
    }

    return null;
}

function hasDecorator(node, name) {
    return (
    node.decorators?.some((dec) => getDecoratorName(dec) === name) ?? false
    );
}

function hasAnyRouteDecorator(node) {
    return (
    node.decorators?.some((dec) =>
        ROUTE_DECORATORS.has(getDecoratorName(dec))
    ) ?? false
    );
}

const requireThrottable = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require @Throttable decorator on every endpoint',
    },
    schema: [],
    messages: {
      missingThrottable:
        'Endpoints must have a @Throttable decorator.',
    },
  },

  defaultOptions: [],

  create(context) {
    if (
      !context.filename.endsWith('.controller.ts') &&
      !context.filename.endsWith('.controller.js')
    ) {
      return {};
    }

    return {
      ClassDeclaration(node) {
        if (!hasDecorator(node, 'Controller')) return;

        for (const element of node.body.body) {
          if (element.type !== 'MethodDefinition') continue;
          if (!element.decorators) continue;

          if (!hasAnyRouteDecorator(element)) continue;

          if (!hasDecorator(element, 'Throttable')) {
            context.report({
              node: element.key,
              messageId: 'missingThrottable',
            });
          }
        }
      },
    };
  },
};

export default requireThrottable;
