document.getElementById('approveButton').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  
  // Get the current active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('git.linecorp.com')) {
    statusDiv.textContent = 'Error: Not on GitHub. Navigate to a GitHub PR page.';
    return;
  }
  
  statusDiv.textContent = 'Starting PR approval process...';
  
  // Execute the content script
  try {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: approvePR
    });
    statusDiv.textContent = 'PR approval process initiated!';
  } catch (error) {
    statusDiv.textContent = `Error: ${error.message}`;
  }
});

// This function will be injected into the GitHub page
function approvePR() {
  const statusMessages = [];
  
  function updateStatus(message) {
    statusMessages.push(message);
    console.log(`GitHub PR Approver: ${message}`);
  }
  
  function findElementByText(text, elementTypes = ['a', 'button', 'span']) {
    const elements = [];
    
    for (const type of elementTypes) {
      const found = Array.from(document.querySelectorAll(type)).filter(el => 
        el.textContent.trim().includes(text)
      );
      elements.push(...found);
    }
    
    return elements.length > 0 ? elements[0] : null;
  }
  
  async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async function executeWorkflow() {
    try {
      // Step 2-3: Find and click "Files changed"
      updateStatus('Looking for "Files changed" tab...');
      const filesChangedElement = findElementByText('Files changed', ['a']);
      
      if (!filesChangedElement) {
        updateStatus('Error: "Files changed" tab not found');
        return;
      }
      
      updateStatus('Clicking "Files changed" tab...');
      filesChangedElement.click();
      
      // Step 4: Wait for 2 seconds
      updateStatus('Waiting for page to load...');
      await sleep(1000);
      
      // Step 5-6: Find and click "Review changes"
      updateStatus('Looking for "Review changes" button...');
      const reviewChangesElement = findElementByText('Review changes', ['button']);
      
      if (!reviewChangesElement) {
        updateStatus('Error: "Review changes" button not found');
        return;
      }
      
      updateStatus('Clicking "Review changes" button...');
      reviewChangesElement.click();
      
      // Wait for the review dialog to open
      await sleep(1000);
      
      // Step 7-8: Find and click "Approve"
      updateStatus('Looking for "Approve" option...');
      const approveElement = findElementByText('Approve', ['input', 'label']);
      
      if (!approveElement) {
        updateStatus('Error: "Approve" option not found');
        return;
      }
      
      updateStatus('Clicking "Approve" option...');
      approveElement.click();
      
      // Step 9: Find and click "Submit review"
      await sleep(500);
      updateStatus('Looking for "Submit review" button...');
      const submitReviewElement = findElementByText('Submit review', ['button']);
      
      if (!submitReviewElement) {
        updateStatus('Error: "Submit review" button not found');
        return;
      }
      
      updateStatus('Clicking "Submit review" button...');
      submitReviewElement.click();
      
      updateStatus('PR approval workflow completed successfully!');
    } catch (error) {
      updateStatus(`Error: ${error.message}`);
    }
  }
  
  executeWorkflow();
}