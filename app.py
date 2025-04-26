# from flask import Flask, request, jsonify
# import requests
# import os
# from flask_cors import CORS

# app = Flask(__name__)
# CORS(app)



# # AI聊天机器人API端点（假设你用的是OpenAI API）
# AI_CHATBOT_API_URL = "https://api.deepseek.com/v1/chat/completions"

# # 你的OpenAI API密钥（正式用时要从环境变量或者安全地方加载，不要硬编码）
# OPENAI_API_KEY = "sk-764ae6f76b1a48d285db597b52bbb97d"

# # 医生身份和上下文信息
# DOCTOR_CONTEXT = {
#     "role": "system",
#     "context": "You are a professional doctor specializing in Internal Medicine. The client is now giving you their answers to a set of medical questions. Provide helpful, professional advice and potential illness prediction based on the user's input."
# }

# # 帮助函数：清理掉空白回答
# def filter_user_data(user_data):
#     return {k: v for k, v in user_data.items() if v.strip() != ""}

# @app.route('/')
# def home():
#     return 'Hello~ The backend is running! 🌸 Please POST data to /submit!'



# @app.route('/submit', methods=['POST'])
# def submit():
#     try:
#         user_data = request.get_json()

#         print("Received user_data:", user_data)

#         if not user_data:
#             return jsonify({"error": "No data received"}), 400

#         # 整理成好看的文字
#         user_message_content = "\n".join([f"{k}: {v}" for k, v in user_data.items()])

#         # 正确的 payload
#         payload = {
#             "model": "deepseek-chat",
#             "messages": [
#                 {"role": "system", "content": DOCTOR_CONTEXT['context']},
#                 {"role": "user", "content": f"Here are my answers:\n{user_message_content}"}
#             ],
#             "temperature": 0.2,
#             "max_tokens": 800
#         }

#         headers = {
#             "Authorization": f"Bearer {OPENAI_API_KEY}",
#             "Content-Type": "application/json"
#         }

#         response = requests.post(AI_CHATBOT_API_URL, json=payload, headers=headers)

#         if response.status_code == 200:
#             analysis_result = response.json()
#             ai_reply = analysis_result['choices'][0]['message']['content']

#             return jsonify({
#                 "message": "Data analyzed successfully",
#                 "analysis": ai_reply
#             }), 200
#         else:
#             print("AI服务器返回了错误！状态码：", response.status_code)
#             print("响应内容：", response.text)
#             return jsonify({
#                 "error": f"Failed to analyze data, status code {response.status_code}",
#                 "details": response.text
#             }), 500

#     except Exception as e:
#         print("出现异常了！！")
#         print(e)
#         return jsonify({"error": str(e)}), 500



# if __name__ == '__main__':
#     app.run(debug=True)

from flask import Flask, request, jsonify
import requests
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# DeepSeek API Configuration
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
DEEPSEEK_API_KEY = "themagicwords:3"  # Recommend setting this via an environment variable

# Doctor Context Configuration
DOCTOR_CONTEXT = {
    "role": "system",
    "content": """You are a professional general practitioner (GP). The user has provided their answers to a medical questionnaire. Analyze the data using the following guidelines:
1. Respond in three parts: [Symptom Analysis], [Possible Conditions], [Recommended Actions].
2. Use plain, conversational language.
3. Maintain a professional but warm tone.
4. If there's insufficient information, request additional input.
5. Avoid using Markdown formatting."""
}

def build_payload(user_input):
    return {
        "model": "deepseek-chat",
        "messages": [
            DOCTOR_CONTEXT,
            {"role": "user", "content": f"Patient's questionnaire responses:\n{user_input}"}
        ],
        "temperature": 0.3,
        "max_tokens": 1024,
        "stream": False  # Disable streaming responses
    }

@app.route('/submit', methods=['POST'])
def submit():
    try:
        # Validate and retrieve data
        user_data = request.get_json()
        if not user_data or not isinstance(user_data, dict):
            return jsonify({"error": "Invalid request format"}), 400

        # Construct user input
        user_input = "\n".join([f"{k}: {v}" for k, v in user_data.items() if v.strip()])

        # Prepare API request
        headers = {
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json"  # DeepSeek may require this
        }

        response = requests.post(
            DEEPSEEK_API_URL,
            json=build_payload(user_input),
            headers=headers,
            timeout=10  # Add timeout to prevent hanging
        )

        # Handle AI response
        if response.ok:
            result = response.json()
            try:
                ai_response = result['choices'][0]['message']['content']
                return jsonify({"analysis": ai_response})
            except KeyError:
                app.logger.error("Unexpected API response format: %s", result)
                return jsonify({"error": "Failed to parse AI response"}), 500
        else:
            app.logger.error("DeepSeek API error: %s - %s", 
                            response.status_code, 
                            response.text)
            return jsonify({
                "error": f"AI service is currently unavailable (status code {response.status_code})"
            }), 500

    except Exception as e:
        app.logger.exception("An error occurred while processing the request")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
