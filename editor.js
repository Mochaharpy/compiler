const scriptLoader = document.createElement('script');
scriptLoader.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/loader.min.js';
document.head.appendChild(scriptLoader);

scriptLoader.onload = () => {
  require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs' } });
  require(['vs/editor/editor.main'], () => {



    monaco.languages.setMonarchTokensProvider('javascript', {
      keywords: [
        'return', 'case', 'catch', 'continue', 'default', 'do', 'else', 'finally', 'if',
        'import', 'switch', 'throw', 'while', 'with', 'yield', 'await', 'async', 'static',
        'private', 'protected', 'readonly', 'let', 'const', 'var', 'false', 'true', 'null',
        'class', 'debugger', 'delete', 'export', 'in', 'instanceof', 'new', 'super', 'this',
        'typeof', 'undefined', 'void', 'of', 'constructor', 'function'
      ],
      tokenizer: {
        root: [

          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],


          [/(\/)((?:\\[^]|\[(?:\\[^]|[^\]])*\]|[^/\\\n])+)(\/)([gimsuy]*)/, ['regex.delimiter', 'regex.pattern', 'regex.delimiter', 'regex.flags']],


          [/(class\s+)([a-zA-Z0-9_$]*)/, ['keyword.custom', 'class.name']],


          [/\bfor(?=\s*\()/, 'keyword.loop'],
          [/\bif(?=\s*\()/, 'keyword.loop'],
          [/\bcatch(?=\s*\()/, 'keyword'],
          [/\b(let|var|false|true|null|debugger|delete|export|in|instanceof|new|super|this|typeof|undefined|void|of|constructor|function|extends|static)\b/, 'keyword.custom'],
          [/\b(break|else)\b/, 'keyword.loop'],


          [/(const\s+)([a-zA-Z_$][\w$]*)/, ['keyword.custom', 'const.identifier']],
          [/\bconst\b/, 'keyword.custom'],


          [/\b([a-zA-Z_$][\w$]*)(?=\s*\()/, 'function.reference'],
          [/=>/, 'keyword.custom'],


          [/(\sextends\s+)([a-zA-Z0-9_$]*)/, ['keyword.custom', 'class.name']],


          [/[a-zA-Z_$][\w$]*/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier'
            }
          }],


          [/\d+/, 'number'],


          [/"/, { token: 'string.quote', next: '@string_double' }],
          [/'/, { token: 'string.quote', next: '@string_single' }],
          [/`/, { token: 'string.quote', next: '@string_backtick' }],


          [/[{}()\[\]]/, '@brackets'],


          [/===|!==|&&|\|\||\?\?/, 'operator.logical'],
          [/[=!<>]=?/, 'operator.comparison'],
          [/[+\-*/%]/, 'operator.arithmetic'],
          [/\?\./, 'operator.optional'],
          [/\?\?/, 'operator.nullish'],
        ],
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\/\*/, 'comment', '@push'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment']
        ],

        string_double: [
          [/[^\\\"\n]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop'],
          [/\n/, '', '@pop']
        ],
        string_single: [
          [/[^\\'\n]+/, 'string'],
          [/\\./, 'string.escape'],
          [/'/, 'string', '@pop'],
          [/'/, 'string', '@pop']
        ],
        string_backtick: [

          [/\$/, 'delimiter.bracket'],
          [/\{/, 'delimiter.bracket', '@bracketed_expression'],
          [/[^\\`\n$]+/, 'string'],
          [/\\./, 'string.escape'],
          [/`/, 'string', '@pop'],
          [/\n/, '', '@pop']
        ],
        bracketed_expression: [
          [/\{/, 'delimiter.bracket', '@bracketed_expression'],
          [/\}/, 'delimiter.bracket', '@pop'],
          { include: 'root' }
        ]
      }
    });

    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'keyword.custom', foreground: '569CD6' },
        { token: 'const.identifier', foreground: '50C1FF' },
        { token: 'let.identifier', foreground: '9CDCFE' },
        { token: 'identifier', foreground: '9CDCFE' },
        { token: 'function.name', foreground: 'DCDCAA' },
        { token: 'function.reference', foreground: 'DCDCAA' },
        { token: 'keyword.loop', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'operator.logical', foreground: 'D4D4D4' },
        { token: 'operator.comparison', foreground: 'D4D4D4' },
        { token: 'operator.arithmetic', foreground: 'D4D4D4' },
        { token: 'operator.optional', foreground: 'D4D4D4' },
        { token: 'operator.nullish', foreground: 'D4D4D4' },
        { token: 'comment', foreground: '6A9955' },
        { token: 'regex.delimiter', foreground: 'D16969' },
        { token: 'regex.pattern', foreground: 'D7BA7D' },
        { token: 'regex.flags', foreground: '569CD6' },
        { token: 'class.name', foreground: '4EC9B0' },
      ],
      colors: {
        'editor.background': '#1e1e1e'
      }
    });


    File.prototype.createMonacoEditor = function () {
      const fileTypeMap = {
        'html': 'html',
        'css': 'css',
        'js': 'javascript'
      };
      const language = fileTypeMap[this.type] || 'text';
      const editorElement = document.getElementById(this.element.id);

      if (editorElement) {
        editorElement.style.display = 'block';
        this.editor = monaco.editor.create(editorElement, {
          value: this.getInitialContent(this.type),
          language: language,
          theme: 'custom-dark',
          automaticLayout: true,
          minimap: { enabled: false },
        });

        if (Object.keys(files).length > 1) {
          editorElement.style.display = 'none';
        }
      }
    };


    for (const fileId in files) {
      if (!files[fileId].editor) {
        files[fileId].createMonacoEditor();
      } else if (Object.keys(files).length === 1) {
        setActiveFile(files[fileId]);
      } else {
        files[fileId].element.style.display = 'none';
      }
    }

    if (Object.keys(files).length === 0) {
      createNewFile('html', 'index.html');
      createNewFile('js', 'script.js');
      createNewFile('css', 'styles.css');
      setActiveFile(files['file0'])
    }
  });
};
