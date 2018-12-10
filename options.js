const saveOptions = () => {
  let editor = document.getElementById("editor").value
  let localFolder = document.getElementById("localFolder").value

  chrome.storage.sync.set(
    {
      editor,
      localFolder
    },
    () => {
      let status = document.getElementById("status")

      status.textContent = "Options saved."
      setTimeout(function() {
        status.textContent = ""
      }, 750)
    }
  )
}

const restoreOptions = () => {
  chrome.storage.sync.get(["editor", "localFolder"], items => {
    document.getElementById("editor").value = items.editor || "vscode"
    document.getElementById("localFolder").value = items.localFolder || ""
  })
}

document.addEventListener("DOMContentLoaded", restoreOptions)
document.getElementById("save").addEventListener("click", saveOptions)
