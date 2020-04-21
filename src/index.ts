import * as ts from 'typescript';

interface ReplaceValues {
  [key: string]: boolean | string;
}

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
          const toReplace = keys.find((key) => key === node.getText());
          if (toReplace) {
            return ts.createLiteral(args.replace[toReplace]);
          }

          return node;
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };
}
