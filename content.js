chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "insertResult") {
      const resultText = message.result || "";
      let textBox = document.querySelector("textarea, input[type='text'], input[type='search'], input[type='url'], input[type='email']");
      if (textBox) {
        textBox.value = resultText;
        console.debug("Inserted result into existing text box:", textBox);
      } else {
        textBox = document.createElement("textarea");
        textBox.style.width = "100%";
        textBox.style.height = "120px";
        textBox.value = resultText;
        document.body.appendChild(textBox);
        console.debug("No text box found. Created new textarea and inserted result.");
      }
      sendResponse({ success: true });
    }
    return true;
  });  