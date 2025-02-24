document.addEventListener("DOMContentLoaded", () => {
    console.debug("Starting debug session...");
    debugger;
  
    const statusEl = document.getElementById("status");
    const answerEl = document.getElementById("answer");
    const explanationEl = document.getElementById("explanation");
    const wrongBtn = document.getElementById("wrong-btn");
    const apiKeyInput = document.getElementById("api-key");
    const saveKeyBtn = document.getElementById("save-key");
    const toggleApiCheckbox = document.getElementById("toggle-api");
    const browserIdEl = document.getElementById("browser-id");
    
    let currentAnswer = "";
    let currentExplanation = "";
    let currentQuestion = "Screenshot-based question";
    let userApiKey = "";
    let apiDisabled = false;
  
    
    chrome.storage.local.get({ browserId: "" }, (result) => {
      let id = result.browserId;
      if (!id) {
        id = "user-" + Math.random().toString(36).substr(2, 9);
        chrome.storage.local.set({ browserId: id });
      }
      browserIdEl.textContent = id;
    });
  
    
    chrome.storage.local.get({ geminiApiKey: "", apiDisabled: false }, (result) => {
      userApiKey = result.geminiApiKey;
      apiDisabled = result.apiDisabled;
      apiKeyInput.value = userApiKey;
      toggleApiCheckbox.checked = apiDisabled;
      if (userApiKey) {
        
        document.querySelector("details.settings").removeAttribute("open");
        statusEl.textContent = apiDisabled ? "API usage is disabled via settings." : "API key loaded. Starting analysis...";
        if (!apiDisabled) {
          captureAndAnalyze();
        }
      } else {
        statusEl.textContent = "Please enter your Gemini API key in Settings.";
      }
    });
  
    saveKeyBtn.addEventListener("click", () => {
      userApiKey = apiKeyInput.value.trim();
      chrome.storage.local.set({ geminiApiKey: userApiKey }, () => {
        console.debug("Saved API key:", userApiKey);
        if (userApiKey && !toggleApiCheckbox.checked) {
          statusEl.textContent = "API key saved. Starting analysis...";
          captureAndAnalyze();
      
          document.querySelector("details.settings").removeAttribute("open");
        } else {
          statusEl.textContent = "API key saved.";
        }
      });
    });
  
    toggleApiCheckbox.addEventListener("change", () => {
      apiDisabled = toggleApiCheckbox.checked;
      chrome.storage.local.set({ apiDisabled: apiDisabled }, () => {
        console.debug("API disabled flag set to:", apiDisabled);
        if (apiDisabled) {
          statusEl.textContent = "API usage is disabled.";
        } else if (userApiKey) {
          statusEl.textContent = "API enabled. Starting analysis...";
          captureAndAnalyze();
        }
      });
    });
  
    wrongBtn.addEventListener("click", async () => {
      wrongBtn.disabled = true;
      statusEl.textContent = "Re-analyzing for a corrected answer...";
      console.debug("User requested re-analysis (Wrong Answer?).");
  
      logAnswer(currentQuestion, currentAnswer, "wrong");
  
      const feedbackPrompt = `
        The previous answer was incorrect. Please re-check the screenshot and give a corrected response.
        Do NOT output JSON or code blocks.
        Format exactly as:
        Answer: <short answer>
        Explanation: <brief explanation>
      `;
      try {
        let newAnswer = await getAnswerFromGemini(feedbackPrompt);
        if (!newAnswer) {
          statusEl.textContent = "No corrected answer returned.";
          wrongBtn.disabled = false;
          return;
        }
        let parsed = parseAnswerExplanation(newAnswer);
        currentAnswer = parsed.answer;
        currentExplanation = parsed.explanation;
  
        statusEl.textContent = "Feedback analysis complete.";
        displayResult(currentAnswer, currentExplanation);
        logAnswer(currentQuestion, currentAnswer, "correct");
        sendResultToPage(formatForTextbox(currentAnswer, currentExplanation));
      } catch (err) {
        statusEl.textContent = "Error: " + err.message;
        console.debug("Error in re-analysis:", err);
      }
      wrongBtn.disabled = false;
    });
  
    async function captureAndAnalyze() {
      if (!userApiKey || apiDisabled) return;
      statusEl.textContent = "Capturing screenshot...";
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
          statusEl.textContent = "Error: No active tab found.";
          return;
        }
        const tab = tabs[0];
        console.debug("Active tab:", tab);
  
        chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg" }, async (dataUrl) => {
          if (chrome.runtime.lastError || !dataUrl) {
            statusEl.textContent = "Error capturing screenshot: " + (chrome.runtime.lastError?.message || "Unknown");
            console.debug("Screenshot capture error:", chrome.runtime.lastError);
            return;
          }
          console.debug("Screenshot captured.");
          let base64Data = dataUrl.split(",")[1];
          statusEl.textContent = "Analyzing with Gemini...";
          try {
            let rawAnswer = await getAnswerFromGemini("", base64Data);
            if (!rawAnswer) {
              statusEl.textContent = "No answer returned from Gemini.";
              return;
            }
            let parsed = parseAnswerExplanation(rawAnswer);
            currentAnswer = parsed.answer;
            currentExplanation = parsed.explanation;
            statusEl.textContent = "Analysis complete.";
            displayResult(currentAnswer, currentExplanation);
            logAnswer(currentQuestion, currentAnswer, "correct");
            wrongBtn.style.display = "inline-block";
            sendResultToPage(formatForTextbox(currentAnswer, currentExplanation));
          } catch (err) {
            statusEl.textContent = "Error: " + err.message;
            console.debug("Error during analysis:", err);
          }
        });
      });
    }
  
    function displayResult(answer, explanation) {
      answerEl.innerHTML = answer ? `<strong>${answer}</strong>` : "";
      explanationEl.innerHTML = explanation ? explanation.replace(/\n/g, "<br>") : "";
    }
  
    function formatForTextbox(answer, explanation) {
      return `${answer}\n\n${explanation}`;
    }
  
    function sendResultToPage(resultText) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) return;
        const tabId = tabs[0].id;
        chrome.tabs.sendMessage(tabId, { action: "insertResult", result: resultText }, (res) => {
          if (chrome.runtime.lastError) {
            console.debug("Error sending result to page:", chrome.runtime.lastError.message);
          } else {
            console.debug("Result sent to page successfully.");
          }
        });
      });
    }
  
    async function getAnswerFromGemini(customPrompt = "", base64Data = "") {
      if (!userApiKey || apiDisabled) return "";
      let promptText = customPrompt ||
        `Analyze the screenshot of this page. If it's multiple choice, provide only the letter as the answer. Otherwise, give the correct short or numeric answer.
  Do NOT output JSON or code blocks.
  Format exactly as:
  Answer: <answer>
  Explanation: <explanation>
  `;
      try {
        let requestBody = {
          contents: [
            { parts: [{ text: promptText }] }
          ]
        };
        if (base64Data) {
          requestBody.contents[0].parts.push({
            inline_data: { mime_type: "image/jpeg", data: base64Data }
          });
        }
        console.debug("Sending request to Gemini API with prompt:", promptText);
        let resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${userApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });
        if (!resp.ok) throw new Error(resp.statusText);
        let json = await resp.json();
        console.debug("Gemini API raw response:", json);
        if (
          json &&
          json.candidates &&
          json.candidates[0] &&
          json.candidates[0].content &&
          json.candidates[0].content.parts &&
          json.candidates[0].content.parts[0]
        ) {
          return json.candidates[0].content.parts[0].text;
        } else {
          throw new Error("No valid Gemini answer");
        }
      } catch (e) {
        statusEl.textContent = "Gemini API failed, using backup...";
        console.debug("Gemini API error:", e);
        return fallbackAnalysis(promptText, base64Data);
      }
    }
  
    async function fallbackAnalysis(promptText, base64Data) {
      let shortData = base64Data ? base64Data.slice(0, 100) + "..." : "";
      let payload = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: promptText + " " + shortData }
        ]
      };
      let resp = await fetch("https://gpt-4o-mini.ai.esb.is-a.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer gpt-4o-mini`
        },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error("Backup API error: " + resp.statusText);
      let data = await resp.json();
      return data.choices?.[0]?.message?.content || "No fallback answer.";
    }
  
    function parseAnswerExplanation(rawText) {
      console.debug("Raw text from Gemini/fallback:", rawText);
      let lines = rawText.split(/\r?\n/);
      let answerLine = "";
      let explanationLines = [];
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.toLowerCase().startsWith("answer:")) {
          answerLine = line.replace(/^answer:\s*/i, "");
        } else if (line.toLowerCase().startsWith("explanation:")) {
          let remainder = line.replace(/^explanation:\s*/i, "");
          explanationLines.push(remainder);
          explanationLines.push(...lines.slice(i + 1));
          break;
        }
      }
      let finalAnswer = answerLine || rawText;
      let finalExplanation = explanationLines.join("\n").trim();
      console.debug("Parsed answer:", finalAnswer);
      console.debug("Parsed explanation:", finalExplanation);
      return { answer: finalAnswer, explanation: finalExplanation };
    }
  
    function logAnswer(question, answer, status) {
      let entry = {
        timestamp: new Date().toISOString(),
        question: question,
        answer: answer,
        status: status
      };
      chrome.storage.local.get({ logs: [] }, (result) => {
        let logs = result.logs;
        logs.push(entry);
        chrome.storage.local.set({ logs: logs });
        console.debug("Logged answer:", entry);
      });
    }
  });  