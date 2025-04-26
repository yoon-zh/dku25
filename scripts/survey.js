// scripts/survey.
document.addEventListener('DOMContentLoaded', () => {
  const API_KEY = 'myapikey';
  const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  const surveyFlow = {
    currentStep: 0,
    answers: {},
     
    init() {
      this.cacheElements();
      this.bindEvents();
      this.hideAllSections();
      document.getElementById('welcome-screen').classList.add('active');
      this.showStep(0);
    },
      
    cacheElements() {
      this.elements = {
        startBtn: document.getElementById('start-survey'),
        questions: Array.from(document.querySelectorAll('.question-step')),
        prevBtn: document.getElementById('prev-question'),
        nextBtn: document.getElementById('next-question'),
        controls: document.querySelector('.survey-controls'),
        summaryTable: document.getElementById('summary-answers'),
        submitBtn: document.getElementById('submit-survey'),
        analysisResult: document.querySelector('.analysis-result'),
        restartBtn: document.getElementById('restart-survey'),
        inputs: Array.from(document.querySelectorAll('input, textarea'))
      };
    },
    
    hideAllSections() {
      document.getElementById('welcome-screen').classList.remove('active');
      document.getElementById('questions-container').classList.remove('active');
      document.getElementById('summary-screen').classList.remove('active');
      document.getElementById('ai-response').classList.remove('active');
      this.elements.controls.style.display = 'none';
    },

    bindEvents() {
      this.elements.startBtn.addEventListener('click', () => this.startSurvey());
      this.elements.prevBtn.addEventListener('click', () => this.prevQuestion());
      this.elements.nextBtn.addEventListener('click', () => this.nextQuestion());
      this.elements.submitBtn.addEventListener('click', () => this.submitSurvey());
      this.elements.restartBtn.addEventListener('click', () => this.restartSurvey());

      this.elements.inputs.forEach(input => {
        input.addEventListener('input', (e) => this.handleInput(e));
      });

      document.querySelectorAll('.select-option, .multiselect-option').forEach(option => {
        option.addEventListener('click', (e) => this.handleOptionSelect(e));
      });
    },

    handleInput(e) {
      const input = e.target;
      const questionId = input.closest('.question-step').dataset.questionId;
      this.answers[questionId] = input.value.trim();
    },
      
    startSurvey() {
      this.hideAllSections();
      document.getElementById('questions-container').classList.add('active');
      this.elements.controls.style.display = 'flex';
      this.showStep(0);
    },
      
    showStep(stepIndex) {
      this.elements.questions.forEach((question, index) => {
        question.style.display = index === stepIndex ? 'block' : 'none';
      });
        
      this.elements.prevBtn.style.display = stepIndex > 0 ? 'flex' : 'none';
      this.elements.nextBtn.textContent = stepIndex === this.elements.questions.length - 1 ? 'Review' : 'Next';
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
      this.hideAllSections();
      document.getElementById('summary-screen').classList.add('active');
        
      this.elements.summaryTable.innerHTML = this.elements.questions
        .map(question => {
          const qId = question.dataset.questionId;
          const qText = question.querySelector('.question-text').textContent;
          const answer = this.answers[qId] || 'Not answered';
          const displayAnswer = answer === '' ? 'Not answered' : answer;
            
          return `
            <tr>
              <td>${qText}</td>
              <td>${Array.isArray(displayAnswer) ? displayAnswer.join(', ') : displayAnswer}</td>
              <td><div class="btn-secondary modify-btn" data-question-id="${qId}">Modify</div></td>
            </tr>
          `;
        })
        .join('');

      document.querySelectorAll('.modify-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.hideAllSections();
          document.getElementById('questions-container').classList.add('active');
          this.elements.controls.style.display = 'flex';
          this.currentStep = parseInt(btn.dataset.questionId) - 1;
          this.showStep(this.currentStep);
        });
      });
    },
      
    async submitSurvey() {
      try {
        this.elements.analysisResult.textContent = 'Analyzing your responses...';
        this.hideAllSections();
        document.getElementById('ai-response').classList.add('active');
        const prompt = buildHealthPrompt(this.answers, this.elements.questions);
        console.log(prompt);
        const analysis = await this.getHealthAnalysis(prompt);
        
        this.elements.analysisResult.textContent = analysis;
      }
      catch (error) {
        console.error('Error:', error);
        this.elements.analysisResult.textContent = 'Error generating analysis. Please try again.';
      }
    },

      
    async getHealthAnalysis(prompt) {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': document.title
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1-distill-llama-70b:free',
          messages: [{
            role: 'user',
            content: prompt
          }],
        })
      });
        
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      return data.choices[0].message.content;
    },
      
    restartSurvey() {
      this.answers = {};
      this.currentStep = 0;
      this.hideAllSections();
      document.getElementById('welcome-screen').classList.add('active');
      this.elements.inputs.forEach(input => input.value = '');
      document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    }
  };
    
  surveyFlow.init();
});