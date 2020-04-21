import * as ts from 'typescript';

interface ReplaceValues {
  [key: string]: boolean | string;
}

const toBoolOrString = (str: string): boolean | string => {
  if (str === 'true' || str === 'false') {
    return Boolean(str);
  }

  return `'${str}'`;
};

export default function transformer(
  _: ts.Program,
  args: { replace: ReplaceValues }
): ts.TransformerFactory<ts.SourceFile> {
  const keys = Object.keys(args.replace || {});

  return (context) => {
    return (sourceFile) => {
      const visitor = (node: ts.Node): ts.Node => {
        if (
          ts.isIdentifier(node) ||
          ts.isExpressionStatement(node) ||
          ts.isPropertyAccessExpression(node) ||
          ts.isTypeOfExpression(node)
        ) {
          const replaceKey = keys.find((key) => key === node.getText());
          if (replaceKey) {
            const replaceValue = args.replace[replaceKey];
            const literalOrEnv =
              typeof replaceValue === 'string' && replaceValue.startsWith('process.env.')
                ? toBoolOrString(
                    process.env[replaceValue.replace('process.env.', '')] || replaceValue
                  )
                : replaceValue;

            return ts.createIdentifier(`${literalOrEnv}`);
          }

          return node;
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };
}