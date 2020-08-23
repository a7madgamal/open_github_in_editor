;(() => {
  const settingsLoaded = (editor, localFolder) => {
    let repoName = location.pathname.split('/')[2]

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
        case 'vscode':
        case 'vscode-insiders':
          url = `${editor}://file${fullPath}${
            lineNumber ? `:${lineNumber}` : ''
          }`
          break

        case 'txmt':
          url = `${editor}://open/?url=file://${fullPath}${
            lineNumber ? `&line=${lineNumber}` : ''
          }`
        default:
          break
      }

      window.open(url, '_self')
    }

    const handleLineClick = (target) => {
      const lineData = target.dataset
      let path

      const closestDetail = target.closest('.js-details-container')
      const closestComment = target.closest('.js-comment-container')

      if (closestDetail) {
        const dataPath = closestDetail.querySelector('[data-path]')

        if (dataPath) {
          path = dataPath.dataset.path
        } else {
          throw new Error('cant find dataPath')
        }
      } else if (closestComment) {
        const fileInfo = closestComment.querySelector('.file-header a')

        if (fileInfo) {
          path = fileInfo.title
        } else {
          throw new Error('cant find fileInfo')
        }
      } else {
        throw new Error('cant find file info')
      }

      openEditor(editor, localFolder, repoName, path, lineData.lineNumber)
    }

    const clickListener = (e) => {
      const target = e.target

      if (target.classList.contains('js-linkable-line-number')) {
        handleLineClick(target)
      } else if (
        target.nodeName === 'A' &&
        target.closest('.js-file-header') !== null
      ) {
        openEditor(editor, localFolder, repoName, target.title)
      } else if (target.dataset && target.dataset.lineNumber) {
        const commentContainer = target.closest('.js-comment-container')

        if (commentContainer) {
          const pathEl = commentContainer.querySelector('.file-header a')

          if (pathEl) {
            const fileRelativePath = pathEl.title
            if (fileRelativePath) {
              openEditor(
                editor,
                localFolder,
                repoName,
                fileRelativePath,
                target.dataset.lineNumber
              )
            } else {
              throw new Error('cant find fileRelativePath')
            }
          } else {
            throw new Error('cant find pathEl')
          }
        } else {
          throw new Error('cant find commentContainer')
        }
      } else return
    }

    document.addEventListener('click', clickListener)
  }

  chrome.storage.sync.get(['editor', 'localFolder'], function ({
    editor,
    localFolder,
  }) {
    settingsLoaded(editor, localFolder)
  })
})()
