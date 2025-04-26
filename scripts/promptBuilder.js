// scripts/promptBuilder.js
window.buildHealthPrompt = function(answers, questions) {
  let prompt = "Analyze this health data and provide a risk assessment:\n\n";
  
  prompt += Object.entries(answers)
    .map(([qId, answer]) => {
      const question = questions.find(q => q.dataset.questionId == qId).question;
      return `Question: ${question}\nAnswer: ${Array.isArray(answer) ? answer.join(', ') : answer}`;
    })
    .join('\n\n');

  prompt += "\n\nProvide analysis in this structured format:\n";
  prompt += "- Current Health Status:\n- Potential Risks:\n- Recommendations:\n- Predicted Health Trends:";
  
  return prompt;
}