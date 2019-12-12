// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

"use strict"

chrome.runtime.onInstalled.addListener(details => {
  // {"previousVersion":"0.2.0","reason":"update"}
  // {"reason":"install"}
  // "install", "update", "chrome_update", or "shared_module_update"
  if (details.reason === "install" || details.reason === "update") {
    chrome.runtime.openOptionsPage()
  }
})
