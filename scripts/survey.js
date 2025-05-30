// scripts/survey.
document.addEventListener('DOMContentLoaded', () => {
  const queryString = window.location.search  
  const params = new URLSearchParams(queryString)  
  const keyValue = params.get("key")
  if (keyValue !== null) {
    API_KEY = atob(keyValue);
  }
  else {
    console.error("No key parameter");
  }

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
      this.initScaleSliders();
    },
      
    cacheElements() {
      this.elements = {
        startBtn: document.getElementById('start-survey'),
        questions: Array.from(document.querySelectorAll('.question-step')),
        prevBtn: document.getElementById('prev-question'),
        nextBtn: document.getElementById('next-question'),
        finishBtn: document.getElementById('finish-modify'),
        controls: document.querySelector('.survey-controls'),
        summaryTable: document.getElementById('summary-answers'),
        submitBtn: document.getElementById('submit-survey'),
        analysisResult: document.querySelector('.analysis-result'),
        restartBtn: document.getElementById('restart-survey'),
        retryBtn: document.getElementById('retry-survey'),
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
      this.elements.finishBtn.addEventListener('click', () => this.showSummary());
      this.elements.submitBtn.addEventListener('click', () => this.submitSurvey());
      this.elements.restartBtn.addEventListener('click', () => this.restartSurvey());
      this.elements.retryBtn.addEventListener('click', () => this.submitSurvey());

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
    
      if (input.classList.contains('scale-slider')) {
        const container = input.closest('.scale-track');
        const fill = container.querySelector('.scale-fill');
        const valueContainer = container.querySelector('.scale-value-container');
        const valueDisplay = container.querySelector('.scale-value');
        const min = parseInt(input.min);
        const max = parseInt(input.max);
        const percentage = ((input.value - min) / (max - min)) * 100;
    
        fill.style.width = `${percentage}%`;
        valueDisplay.textContent = input.value;
      }
    },
      
    startSurvey() {
      this.hideAllSections();
      document.getElementById('questions-container').classList.add('active');
      this.elements.controls.style.display = 'flex';
      this.showStep(0);
    },
      
    showStep(stepIndex) {
      while (stepIndex >= 0 && this.shouldSkipQuestion(this.elements.questions[stepIndex])) {
        stepIndex--;
      }
    
      if (stepIndex < 0) return;
    
      this.currentStep = stepIndex;
      this.elements.questions.forEach((question, index) => {
        question.style.display = index === stepIndex ? 'block' : 'none';
      });
        
      this.elements.prevBtn.style.display = stepIndex > 0 ? 'flex' : 'none';
      this.elements.nextBtn.textContent = stepIndex === this.elements.questions.length - 1 ? 'Review' : 'Next';

      this.elements.finishBtn.style.display = 'flex';

      if (this.isModifying) {
        this.elements.nextBtn.style.display = stepIndex < this.elements.questions.length - 1 ? 'flex' : 'none';
      }
      else {
        this.elements.nextBtn.textContent = stepIndex === this.elements.questions.length - 1 ? 'Review' : 'Next';
      }
    },

    isMainQuestion(question) {
      return !question.dataset.questionId.includes('.');
    },
      
    nextQuestion() {
      let nextStep = this.currentStep + 1;
      
      const currentQuestion = this.elements.questions[this.currentStep];
      if (this.isMainQuestion(currentQuestion)) {
        const answer = this.answers[currentQuestion.dataset.questionId];
        if (answer === 'No') {
        while (nextStep < this.elements.questions.length && 
            !this.isMainQuestion(this.elements.questions[nextStep])) {
          nextStep++;
          }
        }
      }
  
      if (nextStep < this.elements.questions.length) {
        this.currentStep = nextStep;
        this.showStep(this.currentStep);
      }
      else {
        this.showSummary();
      }
    },
      
    prevQuestion() {
      let prevStep = this.currentStep - 1;
      while (prevStep >= 0) {
        const question = this.elements.questions[prevStep];
        const qId = question.dataset.questionId;
    
        if (qId.includes('.')) {
          const parentId = qId.split('.')[0];
          if (this.answers[parentId] === 'No') {
            prevStep--;
            continue;
          }
        }
        break;
      }

      if (prevStep >= 0) {
        this.currentStep = prevStep;
        this.showStep(this.currentStep);
      }
    },
      
    shouldSkipQuestion(question) {
      const qId = question.dataset.questionId;
      if (!qId.includes('.')) return false;
      
      const parentId = qId.split('.')[0];
      return this.answers[parentId] === 'No';
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

    initScaleSliders() {
      document.querySelectorAll('.scale-slider').forEach(slider => {
        const event = new Event('input');
        slider.dispatchEvent(event);
      });
    },

    showSummary() {
      this.hideAllSections();
      document.getElementById('summary-screen').classList.add('active');
        
      this.elements.summaryTable.innerHTML = this.elements.questions
        .map(question => {
          const qId = question.dataset.questionId;
          if (qId.includes('.')) {
            const parentId = qId.split('.')[0];
            if (this.answers[parentId] === 'No') return null;
          }
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
        .filter(row => row !== null)
        .join('');

      document.querySelectorAll('.modify-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.hideAllSections();
          document.getElementById('questions-container').classList.add('active');
          this.elements.controls.style.display = 'flex';
          this.currentStep = parseInt(btn.dataset.questionId) - 1;
          this.showStep(this.currentStep);
          this.isModifying = true;
        });
      });
    },
      
    async submitSurvey() {
      try {
        this.elements.analysisResult.textContent = 'Analyzing your responses...';
        this.hideAllSections();
        this.isModifying = false;
        this.elements.retryBtn.style.display = 'none';
        this.elements.restartBtn.style.display = 'none';
        document.getElementById('ai-response').classList.add('active');
        const prompt = buildHealthPrompt(this.answers, this.elements.questions);
        const analysis = await this.getHealthAnalysis(prompt);
        
        const converter = new showdown.Converter({
          tables: true,
          simplifiedAutoLink: true,
          strikethrough: true,
          tasklists: true
        });
        const html = DOMPurify.sanitize(converter.makeHtml(analysis));
        this.elements.analysisResult.innerHTML = html;
        this.elements.restartBtn.style.display = 'flex';
      }
      catch (error) {
        console.error('Error:', error);
        this.elements.analysisResult.textContent = 'Error generating analysis. Please try again.';
        this.elements.retryBtn.style.display = 'flex';
        this.elements.restartBtn.style.display = 'flex';
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
      this.elements.retryBtn.style.display = 'none';
      this.elements.restartBtn.style.display = 'none';
    }
  };
    
  surveyFlow.init();
});