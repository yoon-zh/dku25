// scripts/promptBuilder.js
window.buildHealthPrompt = function(answers, questions) {
  let prompt = 
  `You are a professional general practitioner (GP). The user has provided their answers to a medical questionnaire. Analyze the data using the following guidelines:
1. Respond in three parts: [Symptom Analysis], [Possible Conditions], [Recommended Actions].
2. Use plain, conversational language.
3. Maintain a professional but warm tone.
4. If there's insufficient information, request additional input.
5. Avoid using Markdown formatting.
Here is the health survey results with the users' input:

`;
  
  prompt += Object.entries(answers)
    .map(([qId, answer]) => {
      const question = questions.find(q => q.dataset.questionId == qId).querySelector('.question-text').textContent;
      return `Question: ${question}\nAnswer: ${Array.isArray(answer) ? answer.join(', ') : answer}`;
    })
    .join('\n\n');
    
  // prompt += "\n\nProvide analysis in this structured format:\n";
  // prompt += "- Current Health Status:\n- Potential Risks:\n- Recommendations:\n- Predicted Health Trends:";
  console.log(prompt);
  return prompt;
}