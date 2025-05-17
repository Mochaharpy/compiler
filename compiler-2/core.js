const tabsDiv = document.getElementById('tabs');
const outputDiv = document.getElementById('output');
const inputDiv = document.getElementById('input');

let files = {};
let fileCounter = 0;
let activeFile = null;
let firstHtmlFileId = null;

class File {
  constructor(type, name, uniqueId) {
    this.uniqueId = uniqueId;
    this.name = name;
    this.type = type;
    this.element = document.createElement('div');
    this.element.classList.add('file');
    this.element.id = `editor-${name.replace('.', '-')}`;
    this.editor = null;
    inputDiv.append(this.element);
  }

  createMonacoEditor() {

  }

  getInitialContent(type) {
    switch (type) {
      case 'html':
        return `<!DOCTYPE html>\n<html>\n\n<head>\n\t<title></title>\n<link rel="stylesheet" href="styles.css">\n<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" /></head>\n\n<body>\n\n\t<script src="script.js"></scr` + `ipt>\n</body>\n\n</html>`;
      case 'css':
        return '/* CSS goes here */';
      case 'js':
        return '// JavaScript goes here';
      default:
        return '';
    }
  }

  getValue() {
    return this.editor ? this.editor.getValue() : '';
  }

  delete() {
    if (this.editor) {
      this.editor.dispose();
    }
    this.element.remove();
  }
}

function createNewFile(type, name) {
  const uniqueId = `file${fileCounter++}`;
  const initialName = name || `${uniqueId}.${type}`;
  const newFile = new File(type, initialName, uniqueId);
  files[uniqueId] = newFile;
  newFile.createMonacoEditor();
  addTab(newFile);
  setActiveFile(newFile);

  if (type === 'html' && firstHtmlFileId === null) {
    firstHtmlFileId = uniqueId;
    previewFirstHtmlFile();
  }
}

function addTab(file) {
  const tab = document.createElement('div');
  tab.classList.add('tab');
  tab.dataset.fileId = file.uniqueId;

  const nameSpan = document.createElement('span');
  nameSpan.textContent = file.name;
  nameSpan.classList.add('file-name');
  tab.appendChild(nameSpan);

  const settings = document.createElement('div');
  settings.classList.add('settings');

  const renameButton = document.createElement('button');
  renameButton.textContent = '✏';
  renameButton.classList.add('rename-button');
  renameButton.addEventListener('click', (event) => {
    event.stopPropagation();
    startRename(tab, file, nameSpan);
  });
  settings.appendChild(renameButton);

  const closeButton = document.createElement('button');
  closeButton.classList.add('close-tab');
  closeButton.textContent = 'x';
  closeButton.addEventListener('click', (event) => {
    event.stopPropagation();
    removeFile(file);
  });
  settings.appendChild(closeButton);

  tab.appendChild(settings);
  tabsDiv.appendChild(tab);


  tab.addEventListener('click', function () {
    setActiveFile(file);
  });
}
