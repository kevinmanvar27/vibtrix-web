// Fix for Safe section icon visibility
// Run this script in browser console if the CSS fixes don't work

(function() {
  console.log('🔧 Fixing Safe section icon visibility...');
  
  // Function to fix icon visibility
  function fixSafeIcons() {
    // Find all potential safe section containers
    const safeSelectors = [
      '[class*="safe"]',
      '[class*="Safe"]',
      '[data-feature*="safe"]',
      '.feature-card:nth-child(2)', // Assuming Safe is the 2nd card
      'div:contains("Safe")',
      'div:contains("Environment")',
      'iframe'
    ];
    
    safeSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          // Fix icons within the element
          const icons = element.querySelectorAll('svg, i, .icon, [class*="icon"]');
          icons.forEach(icon => {
            // Make sure icon is visible
            icon.style.fill = '#6366f1';
            icon.style.color = '#6366f1';
            icon.style.stroke = '#6366f1';
            icon.style.background = 'rgba(99, 102, 241, 0.1)';
            icon.style.borderRadius = '50%';
            icon.style.padding = '8px';
            icon.style.display = 'block';
            icon.style.visibility = 'visible';
            icon.style.opacity = '1';
          });
          
          // Fix progress bars or bottom lines
          const progressElements = element.querySelectorAll('.progress, [class*="progress"], .line, [class*="line"]');
          progressElements.forEach(progress => {
            progress.style.background = 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)';
            progress.style.height = '4px';
            progress.style.borderRadius = '2px';
            progress.style.width = '100%';
          });
          
          // Fix any white text
          const textElements = element.querySelectorAll('*');
          textElements.forEach(text => {
            const computedStyle = window.getComputedStyle(text);
            if (computedStyle.color === 'rgb(255, 255, 255)' || computedStyle.color === 'white') {
              text.style.color = '#374151';
            }
          });
        });
      } catch (e) {
        console.log('Could not apply selector:', selector);
      }
    });
    
    // Special fix for iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
          const style = iframeDoc.createElement('style');
          style.textContent = `
            svg, .icon, i[class*="icon"] {
              fill: #6366f1 !important;
              color: #6366f1 !important;
              stroke: #6366f1 !important;
              background: rgba(99, 102, 241, 0.1) !important;
              border-radius: 50% !important;
              padding: 8px !important;
            }
            .progress, [class*="progress"], .line {
              background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%) !important;
              height: 4px !important;
              border-radius: 2px !important;
            }
          `;
          iframeDoc.head.appendChild(style);
        }
      } catch (e) {
        console.log('Could not access iframe content (cross-origin)');
      }
    });
  }
  
  // Run the fix immediately
  fixSafeIcons();
  
  // Run again after a short delay in case content loads dynamically
  setTimeout(fixSafeIcons, 1000);
  setTimeout(fixSafeIcons, 3000);
  
  // Set up observer for dynamic content
  const observer = new MutationObserver(function(mutations) {
    let shouldFix = false;
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldFix = true;
      }
    });
    if (shouldFix) {
      setTimeout(fixSafeIcons, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('✅ Safe icon fix applied! Icons should now be visible.');
  console.log('💡 If you still don\'t see the icon, try refreshing the page.');
})();
