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

const getGithubFilePath = (container) => {
  // Try multiple selectors for file path (supporting both legacy and React UI)
  const selectors = [
    '[data-path]',
    'a.Link--primary[title]',
    '.file-info a[title]',
    '.file-header a[title]',
    '[class*="DiffFileHeader"] a[title]',
    'a[href*="#diff-"][title]'
  ]

  for (const selector of selectors) {
    const el = container.querySelector(selector)
    if (el) {
      // Try data-path first, then title attribute
      const path = el.dataset?.path || el.title || el.getAttribute('title')
      if (path) return path
    }
  }
  return null
}

const handleGithubLineClick = (target, editor, repoName, localFolder) => {
  const lineData = target.dataset
  let path

  // Try multiple container selectors (legacy and new React UI)
  const containerSelectors = [
    '.js-details-container',
    '[data-details-container-group="file"]',
    '.diff-view',
    '.file',
    '[data-tagsearch-path]'
  ]

  let closestDetail = null
  for (const selector of containerSelectors) {
    closestDetail = target.closest(selector)
    if (closestDetail) break
  }

  // Try multiple comment container selectors
  const commentSelectors = [
    '.js-comment-container',
    '.review-thread-component',
    '.inline-comments',
    '[data-line-comments]'
  ]

  let closestComment = null
  for (const selector of commentSelectors) {
    closestComment = target.closest(selector)
    if (closestComment) break
  }

  if (closestDetail) {
    path = getGithubFilePath(closestDetail)
    if (!path) {
      // Try parent containers as fallback
      const fileContainer = closestDetail.closest('.file') || closestDetail.closest('[data-tagsearch-path]')
      if (fileContainer) {
        path = fileContainer.dataset?.tagsearchPath || getGithubFilePath(fileContainer)
      }
    }
    if (!path) {
      reportError('Github: closestDetail: no path found')
    }
  } else if (closestComment) {
    path = getGithubFilePath(closestComment)
    if (!path) {
      // Try finding file info in parent
      const fileContainer = closestComment.closest('.file') || closestComment.closest('.js-details-container')
      if (fileContainer) {
        path = getGithubFilePath(fileContainer)
      }
    }
    if (!path) {
      reportError('Github: closestComment: no fileInfo')
    }
  } else {
    reportError('Github: no container found for path')
  }

  if (path) {
    openEditor(editor, localFolder, repoName, path, lineData.lineNumber)
  }
}

const isLineNumberElement = (target) => {
  // Check for legacy class or new patterns
  if (target.classList.contains('js-linkable-line-number')) return true
  if (target.classList.contains('blob-num')) return true
  if (target.classList.contains('diff-line-num')) return true

  // Check for data-line-number attribute on element or parent td
  if (target.dataset?.lineNumber) return true
  if (target.closest('td[data-line-number]')) return true

  // Check for line number link patterns
  if (target.nodeName === 'A' && target.href?.includes('#L')) return true

  return false
}

const getLineNumber = (target) => {
  // Try multiple sources for line number
  if (target.dataset?.lineNumber) return target.dataset.lineNumber

  const td = target.closest('td[data-line-number]')
  if (td?.dataset?.lineNumber) return td.dataset.lineNumber

  // Try extracting from href like #L123
  if (target.href) {
    const match = target.href.match(/#L(\d+)/)
    if (match) return match[1]
  }

  // Try text content as fallback
  const text = target.textContent?.trim()
  if (text && /^\d+$/.test(text)) return text

  return null
}

const isFileHeaderElement = (target) => {
  // Check multiple file header patterns
  const headerSelectors = [
    '.js-file-header',
    '.file-header',
    '.file-info',
    '[class*="DiffFileHeader"]',
    '.diff-file-header'
  ]

  for (const selector of headerSelectors) {
    if (target.closest(selector)) return true
  }

  return false
}

const githubClickListener = (e, editor, localFolder) => {
  const repoName = location.pathname.split('/')[2]
  const target = e.target

  // Handle line number clicks (legacy and new UI)
  if (isLineNumberElement(target)) {
    const lineNumber = getLineNumber(target)
    if (lineNumber) {
      // Create a synthetic target with lineNumber for handleGithubLineClick
      const syntheticTarget = {
        dataset: { lineNumber },
        closest: (sel) => target.closest(sel)
      }
      handleGithubLineClick(syntheticTarget, editor, repoName, localFolder)
    } else {
      handleGithubLineClick(target, editor, repoName, localFolder)
    }
  } else if (target.nodeName === 'A' && isFileHeaderElement(target) && target.title) {
    // Handle file header clicks
    openEditor(editor, localFolder, repoName, target.title)
  } else if (target.dataset && target.dataset.lineNumber) {
    // Handle comment line clicks
    const commentSelectors = [
      '.js-comment-container',
      '.review-thread-component',
      '.inline-comments',
      '[data-line-comments]'
    ]

    let commentContainer = null
    for (const selector of commentSelectors) {
      commentContainer = target.closest(selector)
      if (commentContainer) break
    }

    if (commentContainer) {
      const pathEl = commentContainer.querySelector('.Link--primary') ||
                     commentContainer.querySelector('a[title]') ||
                     commentContainer.querySelector('[data-path]')

      if (pathEl) {
        const fileRelativePath = pathEl.title || pathEl.dataset?.path
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

const isBitbucketLineNumber = (target) => {
  // Check multiple patterns for Bitbucket line numbers
  if (target.classList.contains('line-number-permalink')) return true
  if (target.classList.contains('line-numbers')) return true
  if (target.closest('.diff-line-num')) return true
  if (target.closest('[data-qa="line-number"]')) return true

  // Check for line number links
  if (target.nodeName === 'A' || target.nodeName === 'BUTTON') {
    const text = target.textContent?.trim()
    if (text && /^\d+$/.test(text)) return true
  }

  return false
}

const getBitbucketFilePath = (target) => {
  // Try extracting from href hash
  if (target.href) {
    try {
      const hash = target.href.split('#')[1]
      if (hash) {
        // Parse Bitbucket's hash format: chg_path_newlineN or chg_path_oldlineN
        let path = hash
          .replace('chg_', '')
          .replace(/_newline\d*$/, '')
          .replace(/_oldline\d*$/, '')
          .replace('_newline', '___$EP___')
          .replace('_oldline', '___$EP___')
          .split('___$EP___')[0]

        if (path) return path
      }
    } catch (error) {
      // Continue to fallback methods
    }
  }

  // Try finding file path from diff section header
  const diffSelectors = [
    'section.bb-udiff',
    '[data-qa="pr-diff-file-styles"]',
    '.diff-content-container',
    '.file-comment',
    '[data-filename]'
  ]

  for (const selector of diffSelectors) {
    const container = target.closest(selector)
    if (container) {
      // Try data-filename attribute
      if (container.dataset?.filename) return container.dataset.filename

      // Try finding file path in header
      const headerSelectors = [
        '.filename',
        '.file-breadcrumbs-segment-highlighted',
        '[data-qa="bk-filepath"]',
        '.heading a[href*="#chg-"]',
        '.diff-header a',
        'h1.filename',
        '[class*="file-path"]',
        'a[href*="/src/"]'
      ]

      for (const headerSelector of headerSelectors) {
        const el = container.querySelector(headerSelector)
        if (el) {
          // Try text content or href
          const path = el.textContent?.trim() || el.href?.split('#')[1]?.split('?')[0]
          if (path) return path.replace('chg_', '').replace(/^chg-/, '')
        }
      }
    }
  }

  return null
}

const getBitbucketLineNumber = (target) => {
  // Try text content
  const text = target.textContent?.trim()
  if (text && /^\d+$/.test(text)) return parseInt(text)

  // Try data attributes
  if (target.dataset?.lineNumber) return parseInt(target.dataset.lineNumber)

  // Try closest line number cell
  const lineCell = target.closest('[data-qa="line-number"]') || target.closest('.diff-line-num')
  if (lineCell) {
    const lineText = lineCell.textContent?.trim()
    if (lineText && /^\d+$/.test(lineText)) return parseInt(lineText)
  }

  return null
}

const bitbucketClickListener = (e, editor, localFolder) => {
  const repoName = location.pathname.split('/')[2]
  const target = e.target

  if (isBitbucketLineNumber(target)) {
    const lineNumber = getBitbucketLineNumber(target)
    let fileRelativePath = getBitbucketFilePath(target)

    if (!fileRelativePath) {
      // Try parent diff section
      const diffSection = target.closest('section.bb-udiff') ||
                          target.closest('[data-qa="pr-diff-file-styles"]') ||
                          target.closest('[aria-label="Diffs"]')

      if (diffSection) {
        fileRelativePath = getBitbucketFilePath(diffSection)
      }
    }

    if (!fileRelativePath) {
      // Legacy fallback for file comments
      const fileComment = target.closest('.file-comment')
      if (fileComment) {
        try {
          const breadcrumb = fileComment.querySelector('.file-breadcrumbs-segment-highlighted')
          if (breadcrumb?.href) {
            fileRelativePath = breadcrumb.href.split('#')[1]?.split('?')[0]
          }
        } catch (error) {
          // Continue to error
        }
      }
    }

    if (fileRelativePath) {
      openEditor(editor, localFolder, repoName, fileRelativePath, lineNumber)
    } else {
      reportError('Bitbucket: could not determine file path')
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
