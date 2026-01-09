const gradeConversions = {
  '7': { low: [95, 96], mid: [97, 98], high: [99, 100] },
  '6': { low: [90, 91], mid: [92, 93], high: [94, 94] },
  '5': { low: [80, 83], mid: [84, 86], high: [87, 89] },
  '4': { low: [70, 73], mid: [74, 76], high: [77, 79] },
  '3': { low: [60, 63], mid: [64, 66], high: [67, 69] },
  '2': { low: [50, 53], mid: [54, 56], high: [57, 59] },
  '1': { low: [0, 15], mid: [16, 32], high: [33, 49] }
};
// tis grades taken from the thing on announcements 
// (note: the grades for all the 1s are made up by splitting everything evenly)

function parseGrade(gradeText) {
  if (!gradeText || gradeText.trim() === '') return null;
  
  gradeText = gradeText.trim();
  
  if (gradeText.includes('-')) {
    const parts = gradeText.split('-').map(p => p.trim());
    const number = parseInt(parts[0]);
    const subgrade = parts[1].toLowerCase();
    
    if (!isNaN(number) && ['low', 'mid', 'high'].includes(subgrade)) {
      return { number, subgrade, type: 'tis' };
    }
  }
  
  const numberOnly = parseInt(gradeText);
  if (!isNaN(numberOnly) && numberOnly >= 1 && numberOnly <= 7) {
    return { number: numberOnly, subgrade: null, type: 'number' };
  }
  
  return null;
}

function gradeToPercentage(grade) {
  if (!grade) return null;
  
  if (grade.type === 'tis') {
    const range = gradeConversions[grade.number.toString()][grade.subgrade];
    return { low: range[0], high: range[1] };
  } else if (grade.type === 'number') {
    const lowRange = gradeConversions[grade.number.toString()].low;
    const highRange = gradeConversions[grade.number.toString()].high;
    return { low: lowRange[0], high: highRange[1] };
  }
  
  return null;
}

function percentageToTISGrade(percentage) {
  const rounded = Math.round(percentage);
  
  for (const [gradeNum, subgrades] of Object.entries(gradeConversions)) {
    for (const [subgrade, range] of Object.entries(subgrades)) {
      if (rounded >= range[0] && rounded <= range[1]) {
        return `${gradeNum} ${subgrade}`;
      }
    }
  }
  
  if (rounded === 91) return "6 low"; 
  if (rounded === 92 || rounded === 93) return "6 mid";
  if (rounded === 94) return "6 high";
  if (rounded === 95 || rounded === 96) return "7 low";
  if (rounded === 97 || rounded === 98) return "7 mid";
  if (rounded === 99 || rounded === 100) return "7 high";
  
  for (let grade = 7; grade >= 1; grade--) {
    const gradeKey = grade.toString();
    const subgrades = gradeConversions[gradeKey];
    
    const overallLow = Math.min(subgrades.low[0], subgrades.mid[0], subgrades.high[0]);
    const overallHigh = Math.max(subgrades.low[1], subgrades.mid[1], subgrades.high[1]);
    
    if (rounded >= overallLow && rounded <= overallHigh) {
      let closestSubgrade = 'low';
      let minDistance = Infinity;
      
      for (const [subgrade, range] of Object.entries(subgrades)) {
        const rangeMid = (range[0] + range[1]) / 2;
        const distance = Math.abs(rounded - rangeMid);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestSubgrade = subgrade;
        }
      }
      
      return `${grade} ${closestSubgrade}`;
    }
  }
  
  return null;
}

function calculateAverage() {
  const summativeGrades = [];
  
  const rows = document.querySelectorAll('table tr:not(.head)');
  
  rows.forEach(row => {
    const firstCell = row.querySelector('td');
    const cellStyle = firstCell?.getAttribute('style') || '';
    
    if (firstCell && !cellStyle.includes('background: #e5f4ff') && 
        !cellStyle.includes('background-color: #e5f4ff')) {
      
      const attainmentCell = row.querySelector('td:nth-child(2)');
      if (attainmentCell) {
        const gradeDiv = attainmentCell.querySelector('div[style*="font-weight: bold"]');
        if (gradeDiv) {
          const gradeText = gradeDiv.textContent.trim();
          const parsedGrade = parseGrade(gradeText);
          
          if (parsedGrade && gradeText !== '') {
            summativeGrades.push(parsedGrade);
          }
        }
      }
    }
  });
  
  console.log('Found summative grades:', summativeGrades);
  
  if (summativeGrades.length === 0) {
    return { error: 'dam no summative(s) detected', count: 0 };
  }
  
  let totalLow = 0;
  let totalHigh = 0;
  let validGrades = 0;
  
  summativeGrades.forEach(grade => {
    const percentage = gradeToPercentage(grade);
    if (percentage) {
      totalLow += percentage.low;
      totalHigh += percentage.high;
      validGrades++;
      console.log(`Grade: ${grade.number} ${grade.subgrade || ''}, Percentage: ${percentage.low}-${percentage.high}`);
    }
  });
  
  if (validGrades === 0) {
    return { error: 'no valid summative grades found :(', count: 0 };
  }
  
  const avgLow = Math.round((totalLow / validGrades) * 10) / 10;
  const avgHigh = Math.round((totalHigh / validGrades) * 10) / 10;
  
  console.log(`Average: ${avgLow}% - ${avgHigh}%`);
  
  const tisLow = percentageToTISGrade(avgLow);
  const tisHigh = percentageToTISGrade(avgHigh);
  
  console.log(`TIS Grades: ${tisLow} - ${tisHigh}`);
  
  return {
    tisGrade: `${tisLow || 'Unknown'} - ${tisHigh || 'Unknown'}`,
    percentage: `${avgLow}% - ${avgHigh}%`,
    count: validGrades
  };
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "calculateAverage") {
    const result = calculateAverage();
    sendResponse(result);
  }
  return true;
});