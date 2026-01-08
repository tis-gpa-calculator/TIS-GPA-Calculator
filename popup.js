document.addEventListener('DOMContentLoaded', function() {
  const refreshBtn = document.getElementById('refreshBtn');
  const loadingDiv = document.getElementById('loading');
  const resultsDiv = document.getElementById('results');
  const tisGradeDiv = document.getElementById('tisGrade');
  const percentageDiv = document.getElementById('percentage');
  const gradeCountSpan = document.getElementById('gradeCount');

  function calculateAverage() {
    loadingDiv.style.display = 'block';
    resultsDiv.style.display = 'none';
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0].url;
      if (!currentUrl.includes('gibbon.tis.edu.mo') || !currentUrl.includes('Markbook')) {
        loadingDiv.style.display = 'none';
        resultsDiv.style.display = 'block';
        tisGradeDiv.textContent = "error :(";
        if (currentUrl.includes('gibbon.tis.edu.mo')){
          percentageDiv.textContent = "go to assess > markbook page pls :)";
        } else{
          percentageDiv.textContent = "you're not even on gibbon 😭";
        }
        
        gradeCountSpan.textContent = "0";
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, {action: "calculateAverage"}, function(response) {
        if (chrome.runtime.lastError) {
          loadingDiv.style.display = 'none';
          resultsDiv.style.display = 'block';
          tisGradeDiv.textContent = "error :(";
          percentageDiv.textContent = "refresh please :)";
          gradeCountSpan.textContent = "0";
          return;
        }
        
        if (response) {
          loadingDiv.style.display = 'none';
          resultsDiv.style.display = 'block';
          
          if (response.error) {
            tisGradeDiv.textContent = "error :(";
            percentageDiv.textContent = response.error;
            gradeCountSpan.textContent = "0";
          } else {
            
            const tisGradeText = response.tisGrade;
            if (tisGradeText.includes('null') || tisGradeText.includes('Unknown')) {
              tisGradeDiv.textContent = "idk sorry";
              tisGradeDiv.style.fontSize = "18px";
            } else {
              tisGradeDiv.textContent = response.tisGrade;
              tisGradeDiv.style.fontSize = "24px";
            }
            percentageDiv.textContent = response.percentage;
            gradeCountSpan.textContent = response.count;
          }
        }
      });
    });
  }

  calculateAverage();
  refreshBtn.addEventListener('click', calculateAverage);
});