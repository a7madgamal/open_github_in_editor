// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

"use strict"

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ editor: "vscode", localFolder: "" }, () => {
    console.log("setting default editor to vscode")
  })

  chrome.runtime.openOptionsPage()
})
