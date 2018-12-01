console.log("run")
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
      const linePath = `${editor}://file${localFolder}${folderName}/${fileRelativePath}${
        lineNumber ? `:${lineNumber}` : ""
      }`

      window.open(linePath, "_self")
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
