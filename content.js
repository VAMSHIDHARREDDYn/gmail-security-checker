// Track processed emails
const processedEmails = new Set();

// Check for email opens every second
setInterval(checkForEmailOpen, 1000);

function checkForEmailOpen() {
  // Check if we're viewing an email thread
  const emailThread = document.querySelector('[role="main"] div[data-message-id]');
  if (!emailThread) return;

  // Get email ID from data attribute
  const emailId = emailThread.getAttribute('data-message-id');
  if (!emailId || processedEmails.has(emailId)) return;
  processedEmails.add(emailId);

  // Extract email data
  const email = extractEmailData(emailThread);
  if (!email) return;

  // Send to background for analysis
  chrome.runtime.sendMessage({
    action: "analyzeEmail",
    email: { ...email, id: emailId }
  }, (response) => {
    if (response?.analysis) {
      highlightEmail(emailThread, response.analysis);
    }
  });
}

function extractEmailData(emailElement) {
  try {
    const subject = document.querySelector('h2[data-thread-perm-id]')?.textContent;
    const from = emailElement.querySelector('[email]')?.getAttribute('email') || 
                 emailElement.querySelector('.gD')?.textContent;
    const body = emailElement.querySelector('.ii.gt')?.textContent || 
                emailElement.querySelector('.a3s.aiL')?.textContent;

    if (!subject || !from || !body) return null;

    return {
      subject: subject.trim(),
      from: from.trim(),
      body: body.trim(),
      links: Array.from(emailElement.querySelectorAll('a[href]')).map(a => a.href)
    };
  } catch (error) {
    console.error('Error extracting email:', error);
    return null;
  }
}

function highlightEmail(element, analysis) {
  // Remove any existing banner first
  const existingBanner = element.querySelector('.fraud-detector-banner');
  if (existingBanner) existingBanner.remove();

  // Create warning banner
  const banner = document.createElement('div');
  banner.className = 'fraud-detector-banner';
  banner.style.padding = '10px';
  banner.style.margin = '10px 0';
  banner.style.borderRadius = '4px';
  banner.style.fontWeight = 'bold';
  banner.style.fontSize = '14px';
  
  if (analysis.isSuspicious) {
    banner.style.backgroundColor = '#ffebee';
    banner.style.color = '#c62828';
    banner.style.borderLeft = '4px solid #c62828';
    banner.textContent = `⚠️ Suspicious Email (${analysis.confidence}% confidence)`;
  } else if (analysis.isPromotional) {
    banner.style.backgroundColor = '#fff8e1';
    banner.style.color = '#ff8f00';
    banner.style.borderLeft = '4px solid #ff8f00';
    banner.textContent = `📢 Promotional Email (${analysis.confidence}% confidence)`;
  } else {
    banner.style.backgroundColor = '#e8f5e9';
    banner.style.color = '#2e7d32';
    banner.style.borderLeft = '4px solid #2e7d32';
    banner.textContent = `✅ Legitimate Email (${analysis.confidence}% confidence)`;
  }

  // Insert banner at top of email
  const emailContainer = element.closest('.nH.if') || element.closest('[role="main"]');
  if (emailContainer) {
    const firstChild = emailContainer.firstChild;
    if (firstChild) {
      emailContainer.insertBefore(banner, firstChild);
    } else {
      emailContainer.appendChild(banner);
    }
  }
}