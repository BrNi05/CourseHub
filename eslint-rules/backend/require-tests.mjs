import fs from 'node:fs';
import path from 'node:path';

const TARGETS = [
  {
    suffix: '.controller.ts',
    specSuffix: '.controller.spec.ts',
  },
  {
    suffix: '.service.ts',
    specSuffix: '.service.spec.ts',
  },
];

const requireSpecFile = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require a corresponding .spec.ts file for controllers and services',
    },
    schema: [],
    messages: {
      missingSpec:
        'Missing test file "{{specFile}}" for "{{sourceFile}}".',
    },
  },

  defaultOptions: [],

  create(context) {
    const filename = context.filename;

    if (!path.isAbsolute(filename)) {
      return {};
    }

    for (const { suffix, specSuffix } of TARGETS) {
      if (!filename.endsWith(suffix)) continue;

      const dir = path.dirname(filename);
      const base = path.basename(filename, suffix);
      const specFile = `${base}${specSuffix}`;
      const specPath = path.join(dir, specFile);

      if (!fs.existsSync(specPath)) {
        context.report({
          loc: { line: 1, column: 0 },
          messageId: 'missingSpec',
          data: {
            sourceFile: path.basename(filename),
            specFile,
          },
        });
      }

      break;
    }

    return {};
  },
};

export default requireSpecFile;
