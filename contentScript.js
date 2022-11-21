const reportError = (message) => {
  const msg = document.createElement('div')
  const close = document.createElement('span')
  const open = document.createElement('a')

  msg.style =
    'position: fixed;top:0;background-color: pink;z-index: 999999999;font-size: 18px; padding:10px;white-space:pre'
  close.style = 'background-color: red;margin:10px;'
  close.textContent = 'Close warning'

  open.style = ''
  open.textContent = 'Open adon page to leave comment ❤️'
  open.href =
    'https://chrome.google.com/webstore/detail/open-github-in-editor/epklehdbjbicoeeebecaeeeceflgpmga?hl=en&authuser=0'
  open.target = '_blank'

  msg.textContent = `Oops! something went wrong in the open github in editor adon 🙀 \r\n
  Please leave a comment in the plugin page including this error message [${message}] \r\n
  In return, I promise to do my best to fix it ❤️ \r\n
  click me to open the page and hide this error message after a few seconds`

  close.addEventListener('click', () => {
    msg.remove()
  })

  msg.appendChild(close)
  msg.appendChild(open)
  document.body.appendChild(msg)

  throw new Error(message)
}

const openEditor = (
  editor,
  localFolder,
  repoName,
  fileRelativePath,
  lineNumber
) => {
  const fullPath = `${localFolder}${repoName}/${fileRelativePath}`

  let url

  switch (editor) {
    case 'vscode':
    case 'vscode-insiders':
      url = `${editor}://file${fullPath}${lineNumber ? `:${lineNumber}` : ''}`
      break

    case 'txmt':
      url = `${editor}://open/?url=file://${fullPath}${
        lineNumber ? `&line=${lineNumber}` : ''
      }`

    // todo: find the correct scheme
    // case 'webstorm':
    default:
      break
  }

  if (url) {
    window.open(url, '_self')
  } else {
    reportError('openEditor url is empty')
  }
}

const handleGithubLineClick = (target, editor, repoName, localFolder) => {
  const lineData = target.dataset
  let path

  const closestDetail = target.closest('.js-details-container')
  const closestComment = target.closest('.js-comment-container')

  if (closestDetail) {
    const dataPath = closestDetail.querySelector('[data-path]')

    if (dataPath) {
      if (dataPath.dataset.path) {
        path = dataPath.dataset.path
      } else {
        reportError('Github: closestDetail: dataPath has no path')
      }
    } else {
      reportError('Github: closestDetail: no dataPath')
    }
  } else if (closestComment) {
    const fileInfo = closestComment.querySelector('.file-header a')

    if (fileInfo) {
      path = fileInfo.title
    } else {
      reportError('Github: closestComment: no fileInfo')
    }
  } else {
    reportError('Github: closestComment: no path found')
  }

  openEditor(editor, localFolder, repoName, path, lineData.lineNumber)
}

const githubClickListener = (e, editor, localFolder) => {
  const repoName = location.pathname.split('/')[2]
  const target = e.target

  if (target.classList.contains('js-linkable-line-number')) {
    handleGithubLineClick(target, editor, repoName, localFolder)
  } else if (
    target.nodeName === 'A' &&
    target.closest('.js-file-header') !== null &&
    target.title
  ) {
    openEditor(editor, localFolder, repoName, target.title)
  } else if (target.dataset && target.dataset.lineNumber) {
    const commentContainer = target.closest('.js-comment-container')

    if (commentContainer) {
      const pathEl = commentContainer.querySelector('.Link--primary')

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
          reportError('Github: commentContainer: no fileRelativePath')
        }
      } else {
        reportError('Github: commentContainer: no pathEl')
      }
    } else {
      reportError('Github: commentContainer: no commentContainer')
    }
  } else {
    return
  }
}

const bitbucketClickListener = (e, editor, localFolder) => {
  const repoName = location.pathname.split('/')[2]
  const target = e.target

  if (target.classList.contains('line-number-permalink')) {
    const lineNumber = parseInt(target.innerText)
    let fileRelativePath

    if (target.href) {
      try {
        fileRelativePath = target.href
          .split('#')[1]
          .replace('chg_', '')
          .replace('_newline', '___$EP___')
          .replace('_oldline', '___$EP___')
          .split('___$EP___')[0]
      } catch (error) {
        reportError('Bitbucket: line-number-permalink parse failed')
      }

      if (!fileRelativePath) {
        reportError('Bitbucket: failed to get file path')
      }
    } else if (target.closest('.file-comment')) {
      try {
        fileRelativePath = target
          .closest('.file-comment')
          .querySelector('.file-breadcrumbs-segment-highlighted')
          .href.split('#')[1]
          .split('?')[0]
      } catch (error) {
        reportError('Bitbucket: file-comment failed')
      }
    } else {
      reportError('Bitbucket: no fileRelativePath')
    }

    if (fileRelativePath) {
      openEditor(editor, localFolder, repoName, fileRelativePath, lineNumber)
    } else {
      reportError('Bitbucket: empty fileRelativePath')
    }
  }
}

;(() => {
  const onSettingsLoaded = (editor, localFolder) => {
    if (document.location.hostname.includes('github')) {
      document.addEventListener('click', (e) => {
        githubClickListener(e, editor, localFolder)
      })
    } else if (document.location.hostname.includes('bitbucket')) {
      document.addEventListener('click', (e) => {
        bitbucketClickListener(e, editor, localFolder)
      })
    }
  }

  chrome.storage.sync.get(
    ['editor', 'localFolder'],
    ({ editor, localFolder }) => {
      onSettingsLoaded(editor, localFolder)
    }
  )
})()
