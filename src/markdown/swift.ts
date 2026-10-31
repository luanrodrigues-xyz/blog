/**
 * Realce de Swift com as categorias do tema padrão do Xcode. O Xcode colore pelo significado:
 * tipos e funções do projeto têm uma cor, os do sistema (Int, print, .font) outra, e
 * declarações outra ainda. Sem o compilador, aproximamos isso com os nomes que o próprio
 * artigo declara: o que foi declarado em algum bloco é "do projeto"; o resto é "do sistema".
 */

type Token = {
  kind: 'space' | 'comment' | 'doc' | 'string' | 'number' | 'ident' | 'attribute' | 'pound' | 'punct';
  text: string;
};

export type Declarations = { types: Set<string>; functions: Set<string>; members: Set<string> };

const KEYWORDS = new Set(
  (
    'associatedtype actor any as async await borrowing break case catch class consuming continue convenience default defer deinit ' +
    'didSet do dynamic each else enum extension fallthrough false fileprivate final for func guard if import in indirect init inout ' +
    'internal is isolated lazy let macro mutating nil nonisolated nonmutating open operator optional override package precedencegroup ' +
    'private protocol public repeat required rethrows return self Self sending some static struct subscript super switch throw throws ' +
    'true try typealias unowned var weak where while willSet'
  ).split(' '),
);
const ACCESSORS = new Set(['get', 'set']);
const ACCESS = new Set(['private', 'fileprivate', 'internal', 'package', 'public', 'open']);
const AFTER_DOT_KEYWORDS = new Set(['self', 'Self', 'init', 'Type', 'Protocol']);
const TYPE_DECLARATIONS = new Set(['struct', 'class', 'enum', 'protocol', 'actor', 'typealias', 'associatedtype']);
const TYPE_BODIES = new Set(['struct', 'class', 'enum', 'protocol', 'actor', 'extension']);
const POUND_KEYWORDS = new Set([
  'selector',
  'available',
  'unavailable',
  'keyPath',
  'colorLiteral',
  'imageLiteral',
  'fileLiteral',
]);
const DOC_KEYWORD =
  /^(\s*(?:\/\/\/|\*)?\s*)(- (?:Parameters?|Returns|Throws|Note|Important|Warning|Precondition|Postcondition|Complexity|Tip|Experiment)\b[^:\n]*:)/gm;

const IDENT = /^(?:`[^`\n]+`|\$\w*|[A-Za-z_À-￿][\wÀ-￿]*)/u;
const NUMBER =
  /^(?:0x[\da-fA-F_]+(?:\.[\da-fA-F_]+)?(?:[pP][+-]?\d+)?|0b[01_]+|0o[0-7_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d[\d_]*)?)/;

/** Separa o código em tokens. A interpolação `\(…)` volta a ser código dentro da string. */
function lex(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  const push = (kind: Token['kind'], text: string) => {
    if (text) out.push({ kind, text });
  };

  const string = () => {
    const hashes = /^#*/.exec(src.slice(i))![0];
    const multiline = src.startsWith('"""', i + hashes.length);
    const quote = multiline ? '"""' : '"';
    const close = quote + hashes;
    const escape = '\\' + hashes;
    let start = i;
    i += hashes.length + quote.length;
    while (i < src.length) {
      if (src.startsWith(close, i)) {
        i += close.length;
        break;
      }
      if (!multiline && src[i] === '\n') break;
      if (src.startsWith(escape + '(', i)) {
        push('string', src.slice(start, i));
        push('punct', escape + '(');
        i += escape.length + 1;
        code(true);
        if (src[i] === ')') push('punct', src[i++]);
        start = i;
        continue;
      }
      i += src.startsWith(escape, i) && escape.length === 1 ? 2 : 1;
    }
    push('string', src.slice(start, i));
  };

  const code = (inInterpolation: boolean) => {
    let depth = 0;
    while (i < src.length) {
      const rest = src.slice(i);
      const c = src[i];
      if (inInterpolation && c === ')' && depth === 0) return;
      let m: RegExpExecArray | null;
      if ((m = /^\s+/.exec(rest))) {
        push('space', m[0]);
        i += m[0].length;
      } else if (rest.startsWith('//')) {
        const end = rest.indexOf('\n');
        const text = end === -1 ? rest : rest.slice(0, end);
        push(text.startsWith('///') ? 'doc' : 'comment', text);
        i += text.length;
      } else if (rest.startsWith('/*')) {
        let level = 0;
        let j = 0;
        while (j < rest.length) {
          if (rest.startsWith('/*', j)) {
            level++;
            j += 2;
          } else if (rest.startsWith('*/', j)) {
            j += 2;
            if (--level === 0) break;
          } else j++;
        }
        const text = rest.slice(0, j);
        push(text.startsWith('/**') && text !== '/**/' ? 'doc' : 'comment', text);
        i += j;
      } else if (/^#*"/.test(rest)) {
        string();
      } else if ((m = /^#(\w+)/.exec(rest))) {
        push('pound', m[0]);
        i += m[0].length;
      } else if ((m = /^@\w+/.exec(rest))) {
        push('attribute', m[0]);
        i += m[0].length;
      } else if ((m = NUMBER.exec(rest))) {
        push('number', m[0]);
        i += m[0].length;
      } else if ((m = IDENT.exec(rest))) {
        push('ident', m[0]);
        i += m[0].length;
      } else {
        if (c === '(') depth++;
        if (c === ')') depth--;
        push('punct', c);
        i++;
      }
    }
  };

  code(false);
  return out;
}

const isKeyword = (token: Token | undefined, word?: string) =>
  token?.kind === 'ident' && (word ? token.text === word : KEYWORDS.has(token.text));

/**
 * Percorre os tokens significativos acompanhando as chaves, para saber se uma declaração
 * pertence a um tipo (ou ao topo do arquivo) ou a um corpo de código.
 */
function walk(tokens: Token[], visit: (index: number, code: Token[], scope: 'top' | 'type' | 'enum' | 'code') => void) {
  const code = tokens.filter((token) => token.kind !== 'space' && token.kind !== 'comment' && token.kind !== 'doc');
  const stack: ('type' | 'enum' | 'code')[] = [];
  let pending: 'type' | 'enum' | undefined;
  code.forEach((token, index) => {
    const scope = stack.at(-1) ?? 'top';
    visit(index, code, scope);
    if (token.kind === 'ident' && TYPE_BODIES.has(token.text) && !isKeyword(code[index + 1])) {
      pending = token.text === 'enum' ? 'enum' : 'type';
    } else if (token.kind === 'ident' && ['func', 'init', 'var', 'let', 'subscript'].includes(token.text)) {
      pending = undefined;
    } else if (token.text === '{') {
      stack.push(pending ?? 'code');
      pending = undefined;
    } else if (token.text === '}') {
      stack.pop();
    }
  });
  return code;
}

/** Reconhece os nomes de `case a, b(Int)` no corpo de um enum: minúsculos, depois de `case` ou de uma vírgula. */
function enumCases() {
  let open = false;
  let parens = 0;
  return (index: number, code: Token[], scope: string) => {
    const token = code[index];
    const prev = code[index - 1];
    if (token.text === '(') parens++;
    if (token.text === ')') parens--;
    if (scope !== 'enum' || token.text === ';' || token.text === '{' || token.text === '}') open = false;
    if (token.kind === 'ident' && isKeyword(token)) {
      open = scope === 'enum' && token.text === 'case';
      parens = 0;
    }
    return (
      open &&
      parens === 0 &&
      token.kind === 'ident' &&
      /^[a-z_`]/.test(token.text) &&
      !isKeyword(token) &&
      (prev?.text === 'case' || prev?.text === ',')
    );
  };
}

/** Os nomes que os blocos Swift de um artigo declaram. */
export function collectDeclarations(sources: string[]): Declarations {
  const found: Declarations = { types: new Set(), functions: new Set(), members: new Set() };
  for (const source of sources) {
    const cases = enumCases();
    walk(lex(source), (index, code, scope) => {
      const token = code[index];
      const next = code[index + 1];
      if (cases(index, code, scope)) found.members.add(token.text);
      if (token.kind !== 'ident' || next?.kind !== 'ident' || isKeyword(next)) return;
      if (TYPE_DECLARATIONS.has(token.text)) found.types.add(next.text);
      else if (token.text === 'func') found.functions.add(next.text);
      else if ((token.text === 'let' || token.text === 'var') && scope !== 'code') found.members.add(next.text);
    });
  }
  return found;
}

/** Classe do Xcode para cada identificador, conforme a posição e os nomes declarados. */
function classify(tokens: Token[], known: Declarations): Map<Token, string> {
  const classes = new Map<Token, string>();
  const cases = enumCases();
  walk(tokens, (index, code, scope) => {
    const token = code[index];
    const enumCase = cases(index, code, scope);
    if (token.kind !== 'ident') return;
    const prev = code[index - 1];
    const next = code[index + 1];
    const afterDot = prev?.text === '.';
    const label = next?.text === ':' && (prev?.text === '(' || prev?.text === ',');
    const call = next?.text === '(' && tokens[tokens.indexOf(token) + 1] === next;
    const name = token.text;

    if (label && !afterDot && name !== 'default') return;
    if (afterDot ? AFTER_DOT_KEYWORDS.has(name) : KEYWORDS.has(name)) {
      classes.set(token, 'keyword');
      return;
    }
    if (!afterDot && ACCESSORS.has(name)) {
      const inBlock = next?.text === '{' || next?.text === '}' || prev?.text === '{';
      const inModifier = prev?.text === '(' && ACCESS.has(code[index - 2]?.text ?? '');
      if (inBlock || inModifier) {
        classes.set(token, 'keyword');
        return;
      }
    }
    if (prev?.kind === 'ident' && TYPE_DECLARATIONS.has(prev.text)) return classes.set(token, 'decl-type');
    if (prev?.kind === 'ident' && ['func', 'let', 'var'].includes(prev.text)) return classes.set(token, 'decl-other');
    if (enumCase) return classes.set(token, 'decl-other');

    if (/^[A-Z]/.test(name)) return classes.set(token, known.types.has(name) ? 'type' : 'type-system');
    const system = afterDot && code[index - 2]?.text === 'super';
    if (call || (afterDot && next?.text === '{')) {
      if (!system && known.functions.has(name)) return classes.set(token, 'function');
      if (!system && known.members.has(name)) return classes.set(token, 'variable');
      return classes.set(token, 'function-system');
    }
    if (known.members.has(name) && !system) return classes.set(token, 'variable');
    if (known.functions.has(name) && !system) return classes.set(token, 'function');
    if (afterDot) return classes.set(token, 'variable-system');
  });
  return classes;
}

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const span = (name: string, text: string) => `<span class="xc-${name}">${escapeHtml(text)}</span>`;

const docComment = (text: string) => {
  let html = '';
  let last = 0;
  for (const match of text.matchAll(DOC_KEYWORD)) {
    const start = match.index! + match[1].length;
    html += escapeHtml(text.slice(last, start)) + `<span class="xc-doc-keyword">${escapeHtml(match[2])}</span>`;
    last = start + match[2].length;
  }
  return `<span class="xc-doc">${html}${escapeHtml(text.slice(last))}</span>`;
};

/** HTML do bloco com as classes `xc-*`, que o CSS pinta com as cores do Xcode. */
export function highlightSwift(source: string, known: Declarations = collectDeclarations([source])): string {
  const tokens = lex(source);
  const classes = classify(tokens, known);
  return tokens
    .map((token) => {
      switch (token.kind) {
        case 'comment':
          return /^\/\/\s*(MARK|TODO|FIXME):/.test(token.text) ? span('mark', token.text) : span('comment', token.text);
        case 'doc':
          return docComment(token.text);
        case 'string':
          return span('string', token.text);
        case 'number':
          return span('number', token.text);
        case 'attribute':
          return span('attribute', token.text);
        case 'pound':
          return span(POUND_KEYWORDS.has(token.text.slice(1)) ? 'keyword' : 'preprocessor', token.text);
        case 'ident': {
          const name = classes.get(token);
          return name ? span(name, token.text) : escapeHtml(token.text);
        }
        default:
          return escapeHtml(token.text);
      }
    })
    .join('');
}

/** Os blocos ```swift de um documento Markdown, para colher as declarações do artigo inteiro. */
export const swiftBlocks = (markdown: string) =>
  [...markdown.matchAll(/^([ \t]*)(`{3,}|~{3,})swift\b[^\n]*\n([\s\S]*?)^\1\2[ \t]*$/gm)].map((match) => match[3]);
