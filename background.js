// Store email analysis results
let emailAnalysisCache = {};

// Show notification for suspicious emails
function showAlertNotification(email, analysis) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: `⚠️ ${analysis.isSuspicious ? 'Suspicious' : analysis.isPromotional ? 'Promotional' : 'Legitimate'} Email Detected`,
    message: `${email.subject}\nFrom: ${email.from}`,
    priority: 2,
    buttons: [
      { title: 'View Email' }
    ]
  });
}

// Analyze email content
function analyzeEmail(email) {
  const { subject, from, body } = email;
  let result = {
    isSuspicious: false,
    isPromotional: false,
    isLegitimate: false,
    reasons: [],
    confidence: 0
  };

  // Fraud indicators
  const fraudIndicators = [
    { pattern: /urgent|immediate action|account suspended/i, weight: 0.8 },
    { pattern: /password reset|verify account/i, weight: 0.7 },
    { pattern: /bank|paypal|irs|tax/i, weight: 0.6 },
    { pattern: /click here|login now/i, weight: 0.5 },
    { pattern: /dear customer|valued member/i, weight: 0.4 },
    { pattern: /unusual activity/i, weight: 0.7 }
  ];

  // Promotional indicators
  const promoIndicators = [
    { pattern: /sale|discount|offer|limited time/i, weight: 0.8 },
    { pattern: /unsubscribe|preferences/i, weight: 0.7 },
    { pattern: /newsletter|promotion/i, weight: 0.6 }
  ];

  // Analyze content
  let fraudScore = fraudIndicators.reduce((score, indicator) => 
    indicator.pattern.test(subject) || indicator.pattern.test(body) ? 
    score + indicator.weight : score, 0);

  let promoScore = promoIndicators.reduce((score, indicator) => 
    indicator.pattern.test(subject) || indicator.pattern.test(body) ? 
    score + indicator.weight : score, 0);

  // Determine email type
  if (fraudScore > 1.5) {
    result.isSuspicious = true;
    result.confidence = Math.min(100, Math.round(fraudScore * 30));
  } else if (promoScore > 1.0) {
    result.isPromotional = true;
    result.confidence = Math.min(100, Math.round(promoScore * 30));
  } else {
    result.isLegitimate = true;
    result.confidence = 80;
  }

  return result;
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeEmail") {
    const analysis = analyzeEmail(request.email);
    emailAnalysisCache[request.email.id] = analysis;
    
    // Show notification if enabled
    chrome.storage.sync.get(['notifications'], (data) => {
      if (data.notifications !== false && (analysis.isSuspicious || analysis.isPromotional)) {
        showAlertNotification(request.email, analysis);
      }
    });
    
    sendResponse({ analysis });
  }
  return true;
});