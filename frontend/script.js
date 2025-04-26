const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');
const chatBody = document.getElementById('chatBody');

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const message = userInput.value.trim();
  if (message !== "") {
    appendMessage(message, 'user');
    userInput.value = "";
    setTimeout(() => {
      botReply(message);
    }, 600);
  }
}

function appendMessage(message, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('chat-message', sender + '-message');
  msgDiv.innerHTML = `<p>${message}</p>`;
  chatBody.appendChild(msgDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function botReply(userText) {
  const reply = `🤖 Bot: You said "${userText}"`;
  appendMessage(reply, 'bot');
}
