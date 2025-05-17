function startRename(tabElement, file, nameSpanElement) {
  tabElement.isEditing = true;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = file.name;
  input.classList.add('rename-input');
  input.addEventListener('blur', () => finishRename(tabElement, file, input, nameSpanElement));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      finishRename(tabElement, file, input, nameSpanElement);
    } else if (event.key === 'Escape') {
      cancelRename(tabElement, nameSpanElement);
    }
  });

  nameSpanElement.replaceWith(input);
  input.select();
}

function finishRename(tabElement, file, inputElement, nameSpanElement) {
  tabElement.isEditing = false;
  const newName = inputElement.value.trim();
  if (newName && newName !== file.name && !isFileAlreadyExists(newName)) {
    const oldName = file.name;
    file.name = newName;
    nameSpanElement.textContent = newName;
    inputElement.replaceWith(nameSpanElement);


    tabElement.dataset.fileName = newName;


    if (file.uniqueId === firstHtmlFileId) {
      previewFirstHtmlFile();
    }

  } else {
    cancelRename(tabElement, nameSpanElement);
  }
}

function cancelRename(tabElement, nameSpanElement) {
  tabElement.isEditing = false;
  const inputElement = tabElement.querySelector('.rename-input');
  if (inputElement) {
    const fileId = tabElement.dataset.fileId;
    const file = files[fileId];
    if (file) {
      nameSpanElement.textContent = file.name;
    }
    inputElement.replaceWith(nameSpanElement);
  }
}

function isFileAlreadyExists(name) {
  return Object.values(files).some(file => file.name === name);
}

function setActiveFile(file) {
  if (activeFile) {
    activeFile.element.classList.remove('active');
    activeFile.element.style.display = 'none';

    const currentActiveTab = document.querySelector(`#tabs .tab.active`);
    if (currentActiveTab) {
      currentActiveTab.classList.remove('active');
    }
  }

  activeFile = file;
  activeFile.element.classList.add('active');
  activeFile.element.style.display = 'block';

  const newActiveTab = document.querySelector(`#tabs .tab[data-fileid="${file.uniqueId}"]`);
  if (newActiveTab) {
    newActiveTab.classList.add('active');
  }

  if (activeFile.editor) {
    activeFile.editor.layout();
  }
}

function removeFile(fileToRemove) {
  if (activeFile === fileToRemove) {
    const fileIds = Object.keys(files);
    const indexToRemove = fileIds.indexOf(fileToRemove.uniqueId);
    if (indexToRemove > -1) {
      fileIds.splice(indexToRemove, 1);
      if (fileIds.length > 0) {
        setActiveFile(files[fileIds[0]]);
      } else {
        activeFile = null;
      }
    }
  }

  const tabToRemove = document.querySelector(`#tabs .tab[data-fileid="${fileToRemove.uniqueId}"]`);
  if (tabToRemove) {
    tabsDiv.removeChild(tabToRemove);
  }

  fileToRemove.delete();
  delete files[fileToRemove.uniqueId];


  if (fileToRemove.uniqueId === firstHtmlFileId) {
    firstHtmlFileId = null;

    for (const id in files) {
      if (files[id].type === 'html') {
        firstHtmlFileId = id;
        previewFirstHtmlFile();
        break;
      }
    }
  } else if (Object.keys(files).length > 0 && firstHtmlFileId === null) {

    for (const id in files) {
      if (files[id].type === 'html') {
        firstHtmlFileId = id;
        previewFirstHtmlFile();
        break;
      }
    }
  }
}

function findFileByPath(filePath) {
  for (const fileId in files) {
    if (files[fileId].name === filePath || files[fileId].uniqueId === filePath) {
      return files[fileId];
    }
  }
  return null;
}

function queryFileByName(targetFileName) {
  return Object
    .values(files)
    .find(f => f.name === targetFileName) || null;
}

/**
 * Logs all the locally-hosted files from your manifest that actually
 * exist in your `files` object.
 *
 * @param {{ [key: string]: File }} files
 * @param {{
*   stylesheets: string[],
*   scripts:     string[],
*   images:      string[],
*   fonts:       string[],
*   media:       string[]
* }} manifest
*/
function LocalFiles(files, manifest) {
 // 1) Gather every declared dependency into one flat array:
 const allEntries = Object.values(manifest).flat();    
 //    e.g. ["styles.css", "https://…/all.min.css", "script.js", …]

 // 2) Filter out any that look like URLs (i.e. external CDNs)
 const localNames = allEntries.filter(name => {
   try {
     new URL(name);
     return false;    // valid URL ⇒ external ⇒ drop it
   } catch {
     return true;     // invalid URL ⇒ local filename ⇒ keep it
   }
 });
 //    => ["styles.css", "script.js"]
 let foundDependencies = []
 // 3) For each local filename, find & log the matching File object
 localNames.forEach(filename => {
   const match = Object.values(files).find(f => f.name === filename);
   if (match) {
     foundDependencies.push({name: filename, code: match.getValue()})
   } else {
     console.warn(`⚠️  "${filename}" declared but not found in files`);
   }
 });
 return foundDependencies
}
