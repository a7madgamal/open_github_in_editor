;(() => {
  const settingsLoaded = (editor, localFolder) => {
    let repoName = location.pathname.split("/")[2]

    const openEditor = (
      editor,
      localFolder,
      folderName,
      fileRelativePath,
      lineNumber
    ) => {
      const fullPath = `${localFolder}${folderName}/${fileRelativePath}`
      let url

      switch (editor) {
        case "vscode":
        case "vscode-insiders":
          url = `${editor}://file${fullPath}${
            lineNumber ? `:${lineNumber}` : ""
          }`
          break

        case "txmt":
          url = `${editor}://open/?url=file://${fullPath}${
            lineNumber ? `&line=${lineNumber}` : ""
          }`
        default:
          break
      }

      window.open(url, "_self")
    }

    const handleLineClick = target => {
      const lineData = target.dataset
      const fileData = target
        .closest(".js-details-container")
        .querySelector("[data-path]").dataset

      openEditor(
        editor,
        localFolder,
        repoName,
        fileData.path,
        lineData.lineNumber
      )
    }

    const clickListener = e => {
      const target = e.target

      if (target.classList.contains("js-linkable-line-number")) {
        handleLineClick(target)
      } else if (
        target.nodeName === "A" &&
        target.closest(".js-file-header") !== null
      ) {
        openEditor(editor, localFolder, repoName, target.title)
      } else return
    }

    document.addEventListener("click", clickListener)
  }

  chrome.storage.sync.get(["editor", "localFolder"], function({
    editor,
    localFolder
  }) {
    settingsLoaded(editor, localFolder)
  })
})()
