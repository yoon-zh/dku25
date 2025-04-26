document.addEventListener('DOMContentLoaded', () => {
  const surveyFlow = {
    currentStep: 0,
    answers: {},
     
    init() {
      this.cacheElements();
      this.bindEvents();
      this.showStep(0);
    },
      
    cacheElements() {
      this.elements = {
        startBtn: document.getElementById('start-survey'),
        questions: Array.from(document.querySelectorAll('.question-step')),
        prevBtn: document.getElementById('prev-question'),
        nextBtn: document.getElementById('next-question'),
        summaryTable: document.getElementById('summary-answers'),
        submitBtn: document.getElementById('submit-survey'),
        analysisResult: document.querySelector('.analysis-result'),
        restartBtn: document.getElementById('restart-survey')
      };
    },
      
    bindEvents() {
      this.elements.startBtn.addEventListener('click', () => this.startSurvey());
      this.elements.prevBtn.addEventListener('click', () => this.prevQuestion());
      this.elements.nextBtn.addEventListener('click', () => this.nextQuestion());
      this.elements.submitBtn.addEventListener('click', () => this.submitSurvey());
      this.elements.restartBtn.addEventListener('click', () => this.restartSurvey());

      document.querySelectorAll('.select-option, .multiselect-option').forEach(option => {
        option.addEventListener('click', (e) => this.handleOptionSelect(e));
      });
    },
      
    startSurvey() {
      document.getElementById('welcome-screen').classList.remove('active');
      document.getElementById('questions-container').classList.add('active');
      this.showStep(0);
    },
      
    showStep(stepIndex) {
      this.elements.questions.forEach((question, index) => {
        question.style.display = index === stepIndex ? 'block' : 'none';
      });
        
      this.elements.prevBtn.style.display = stepIndex > 0 ? 'flex' : 'none';
      this.elements.nextBtn.textContent = stepIndex === this.elements.questions.length - 1 ? 'Finish' : 'Next';
    },
      
    nextQuestion() {
      if (this.currentStep < this.elements.questions.length - 1) {
        this.currentStep++;
        this.showStep(this.currentStep);
      }
      else {
        this.showSummary();
      }
    },
      
    prevQuestion() {
      if (this.currentStep > 0) {
        this.currentStep--;
        this.showStep(this.currentStep);
      }
    },
      
    handleOptionSelect(e) {
      const option = e.currentTarget;
      const questionId = option.closest('.question-step').dataset.questionId;
      const questionType = option.closest('.select-options') ? 'select' : 'multiselect';
        
      if (questionType === 'select') {
        option.parentElement.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        option.classList.add('selected');
        this.answers[questionId] = option.dataset.value;
      }
      else {
        option.classList.toggle('selected');
        const selected = Array.from(option.parentElement.querySelectorAll('.selected'))
                          .map(el => el.dataset.value);
        this.answers[questionId] = selected;
      }
    },
      
    showSummary() {
      document.getElementById('questions-container').classList.remove('active');
      document.getElementById('summary-screen').classList.add('active');
        
      this.elements.summaryTable.innerHTML = this.elements.questions
        .map(question => {
          const qId = question.dataset.questionId;
          const qText = question.querySelector('.question-text').textContent;
          const answer = this.answers[qId] || 'Not answered';
            
          return `
            <tr>
              <td>${qText}</td>
              <td>${Array.isArray(answer) ? answer.join(', ') : answer}</td>
              <td><div class="btn-secondary modify-btn" data-question-id="${qId}">Modify</div></td>
            </tr>
          `;
        })
        .join('');

      document.querySelectorAll('.modify-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const questionId = btn.dataset.questionId;
          this.currentStep = parseInt(questionId) - 1;
          document.getElementById('summary-screen').classList.remove('active');
          document.getElementById('questions-container').classList.add('active');
          this.showStep(this.currentStep);
        });
      });
    },
      
    async submitSurvey() {
      const prompt = Object.entries(this.answers)
        .map(([qId, answer]) => {
          const question = site.data.survey.questions.find(q => q.id == qId).question;
          return `Question: ${question}\nAnswer: ${Array.isArray(answer) ? answer.join(', ') : answer}`;
        })
        .join('\n\n');
        
      try {
        const analysis = await this.getHealthAnalysis(prompt);
        document.getElementById('summary-screen').classList.remove('active');
        document.getElementById('ai-response').classList.add('active');
        this.elements.analysisResult.textContent = analysis;
      }
      catch (error) {
        console.error('Error:', error);
        alert('Error generating analysis. Please try again.');
      }
    },
      
    async getHealthAnalysis(prompt) {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': document.title
        },
        body: JSON.stringify({
          model: 'google/palm-2',
          messages: [{
            role: 'user',
            content: `Analyze this health data and provide a risk assessment:\n\n${prompt}`
          }]
        })
      });
        
      const data = await response.json();
      return data.choices[0].message.content;
    },
      
    restartSurvey() {
      this.currentStep = 0;
      this.answers = {};
      document.getElementById('ai-response').classList.remove('active');
      document.getElementById('welcome-screen').classList.add('active');
      this.elements.questions.forEach(q => q.style.display = 'none');
      document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
      document.querySelectorAll('input, textarea').forEach(el => el.value = '');
    }
  };
    
  surveyFlow.init();
});