// scripts/openrouter.js
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('llm-form');
    const responseDiv = document.getElementById('llm-response');
    const API_KEY = 'YOUR_API_KEY';
    const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const prompt = document.getElementById('llm-prompt').value;
        
        if (!prompt) {
            responseDiv.textContent = "Please enter a prompt";
            return;
        }

        responseDiv.textContent = "Generating...";

        try {
            const response = await fetch(API_URL, {
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
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            responseDiv.textContent = data.choices[0].message.content;
        } catch (error) {
            console.error('Error:', error);
            responseDiv.textContent = "Error generating response. Please try again.";
        }
    });
});