import fs from 'node:fs';
import path from 'node:path';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

// Check if decorator is @Controller or @Controller(...)
function isControllerDecorator(decorator) {
  const expr = decorator.expression;
  if (expr.type === AST_NODE_TYPES.Identifier && expr.name === 'Controller') {
    return true;
  }
  if (
    expr.type === AST_NODE_TYPES.CallExpression &&
    expr.callee.type === AST_NODE_TYPES.Identifier &&
    expr.callee.name === 'Controller'
  ) {
    return true;
  }
  return false;
}

// Check if decorator is @Serialize(...)
function isSerializeDecorator(decorator) {
  const expr = decorator.expression;
  return (
    expr.type === AST_NODE_TYPES.CallExpression &&
    expr.callee.type === AST_NODE_TYPES.Identifier &&
    expr.callee.name === 'Serialize'
  );
}

// Check if decorator is @UseInterceptors(new SerializerInterceptor(...))
// Returns the DTO argument node if found, otherwise null.
function getOldSerializerDto(decorator) {
  const expr = decorator.expression;
  
  // Must be a call: @UseInterceptors(...)
  if (
    expr.type !== AST_NODE_TYPES.CallExpression ||
    expr.callee.type !== AST_NODE_TYPES.Identifier ||
    expr.callee.name !== 'UseInterceptors'
  ) {
    return null;
  }

  for (const arg of expr.arguments) {
    if (
      arg.type === AST_NODE_TYPES.NewExpression &&
      arg.callee.type === AST_NODE_TYPES.Identifier &&
      arg.callee.name === 'SerializerInterceptor'
    ) {
      return arg.arguments.length > 0 ? arg.arguments[0] : undefined;
    }
  }

  return null;
}

// Heuristic to guess the DTO name based on the controller filename and nearby entity files
function guessEntityType(filename) {
  try {
    const dir = path.dirname(filename);
    const entitiesDir = path.join(dir, 'entity'); 
    
    if (!fs.existsSync(entitiesDir)) {
      const base = path.basename(filename).split('.')[0];
      return base.charAt(0).toUpperCase() + base.slice(1) + 'Dto';
    }

    const files = fs
      .readdirSync(entitiesDir)
      .filter((f) => f.endsWith('.ts') || f.endsWith('.js'));
    
    if (!files.length) return null;

    const filePath = path.join(entitiesDir, files[0]);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const match =
      fileContent.match(/export\s+class\s+(\w+)/) ||
      fileContent.match(/class\s+(\w+)/);
    
    return match ? match[1] : null;
  } catch {
    return 'UnknownDto';
  }
}

const enforceSerializeDecoratorRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce @Serialize decorator and ban old SerializerInterceptor usage',
    },
    fixable: 'code',
    schema: [],
    messages: {
      bannedInterceptor:
        '"new SerializerInterceptor()" is deprecated. Use the @Serialize() decorator instead.',
      missingSerialize:
        'Controllers must be decorated with @Serialize(Dto).',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ClassDeclaration(node) {
        const decorators = node.decorators || [];
        const controllerDecorator = decorators.find(isControllerDecorator);

        if (!controllerDecorator) return;

        let serializeDecorator = null;
        let oldInterceptorDecorator = null;
        let oldInterceptorDtoNode = null;

        for (const deco of decorators) {
          if (isSerializeDecorator(deco)) {
            serializeDecorator = deco;
          }
          
          const dtoNode = getOldSerializerDto(deco);
          if (dtoNode !== null) {
            oldInterceptorDecorator = deco;
            oldInterceptorDtoNode = dtoNode;
          }
        }

        const sourceCode = context.sourceCode;

        // Banned: old interceptor logic
        if (oldInterceptorDecorator) {
          context.report({
            node: oldInterceptorDecorator,
            messageId: 'bannedInterceptor',
            fix(fixer) {
              const dtoText = oldInterceptorDtoNode
                ? sourceCode.getText(oldInterceptorDtoNode)
                : '';

              if (oldInterceptorDecorator.expression.arguments.length === 1) {
                 return fixer.replaceText(
                  oldInterceptorDecorator,
                  `@Serialize(${dtoText})`
                );
              }

              return fixer.replaceText(
                  oldInterceptorDecorator,
                  `@Serialize(${dtoText})`
                );
            },
          });
        }

        // No Serialize decorator found
        if (!serializeDecorator && !oldInterceptorDecorator) {
          const guessedDto = guessEntityType(context.filename) || 'MyResponseDto';
          
          context.report({
            node: node.id || node,
            messageId: 'missingSerialize',
            fix(fixer) {
              return fixer.insertTextBefore(
                decorators[0],
                `@Serialize(${guessedDto})\n`
              );
            },
          });
        }
      },
    };
  },
};

export default enforceSerializeDecoratorRule;