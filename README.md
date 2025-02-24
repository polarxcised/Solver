 # `Solver`

**Solver** is a versatile Chrome extension that can help you tackle homework questions, analyze screenshots, and assist with general problem-solving. Powered by large language models, **Solver** can interpret images (like screenshots of math problems) or text prompts and provide concise, step-by-step solutions.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Installation](#installation)
- [Usage](#usage)
  - [Setting Your API Key](#setting-your-api-key)
  - [Capturing Screenshots](#capturing-screenshots)
  - [Receiving Answers](#receiving-answers)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Solver** leverages the Gemini API (and optionally a backup service) to analyze questions, text, or images you provide. It can be used for:
- **Homework help**: Mathematics, science, language, and more.  
- **General problem solving**: Explanation of concepts, short Q&A.  
- **Screenshot analysis**: Quickly extract information from an image of a question or a diagram.

The extension prompts the model to return an **Answer** and an **Explanation** in a consistent format, making it easy to read and understand.

---

## Key Features

1. **Screenshot Analysis**  
   - Capture your active Chrome tab as a screenshot and automatically feed it to the model for interpretation.

2. **Text Prompts**  
   - Enter any text prompt (like a math problem or short question) and receive a detailed answer.

3. **User-Friendly Output**  
   - The extension returns a short, direct **Answer** and a concise **Explanation**.  

4. **Feedback Loop**  
   - If the provided solution is incorrect, you can request a re-analysis for a corrected answer.

5. **API Key Management**  
   - Easily store your Gemini API key for repeated usage.  
   - Toggle API usage on/off in settings.

6. **Logging**  
   - Keep track of your previous questions and answers for review.

---

## Installation

1. **Clone or Download** the project from this repository.  
2. **Open Chrome** and navigate to `chrome://extensions`.  
3. Enable **Developer Mode** (toggle in the top-right corner).  
4. Click **Load unpacked** and select the folder containing the extension.  
5. Once loaded, you should see the **Solver** extension icon in your toolbar.

---

## Usage

### Setting Your API Key

1. Click the **Solver** extension icon in your Chrome toolbar.  
2. In the extension popup, open the **Settings** section.  
3. Enter your **Gemini API key** in the text field and click **Save**.  
4. (Optional) Check or uncheck **Disable API** if you want to temporarily turn off the model requests.

> **Note**: Your API key is stored locally on your machine. For security, do not share it with anyone.

### Capturing Screenshots

1. Open the webpage with the homework problem or question you want to solve.  
2. Click the **Solver** icon to open the popup.  
3. If you have an API key set and the API usage is **enabled**, the extension will automatically capture the visible tab.  
4. **Solver** will send the screenshot to the model for analysis.

### Receiving Answers

- After a short processing time, the extension will display:
  - **Answer**: A concise solution or result.  
  - **Explanation**: Brief reasoning or steps taken to arrive at the answer.

If you believe the answer is incorrect, click the **“Wrong Answer?”** button to request a re-analysis. This prompts the model to refine its answer based on the previous response.

---

## FAQ

1. **Why do I need an API key?**  
   The Gemini service requires an API key for authentication and billing/tracking usage.

2. **What if my screenshot is large?**  
   Solver attempts to process standard screenshot sizes. If your image is extremely large, it may fail or be truncated. Consider zooming in on the specific question before capturing.

3. **Is my data safe?**  
   Only the screenshot and/or prompt text is sent to the Gemini API for processing. We do not store your data on remote servers beyond what is needed for the API request. Your API key is stored locally.

4. **Why is the answer sometimes incorrect?**  
   Large language models can occasionally hallucinate or provide incomplete answers. Use your best judgment and the “Wrong Answer?” re-analysis option when needed.

5. **How do I reset or change my API key?**  
   Go to **Settings** in the popup, delete your old key, and save a new one.

---

## Contributing

Contributions, bug reports, and feature requests are welcome! Feel free to open an issue or submit a pull request. 

---

## License

This project is released under the [MIT License](LICENSE). You’re free to modify and distribute the code as long as the original license is included.

---

**Thank you for using Solver!** We hope it helps streamline your homework and problem-solving tasks. If you have questions or suggestions, please let us know.
