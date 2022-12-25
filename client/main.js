import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const btnClear = document.querySelector('.btn-clear');
const chatContainer = document.querySelector('#chat_container');

let loadInterval;

function loader(element) {
    element.textContent = '';

    loadInterval = setInterval(() => {
        element.textContent += '.';

        if (element.textContent === '....') {
            element.textContent = '';
        }
    }, 300);
}

function typeText(element, text) {
    let index = 0;

    let interval = setInterval(() => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index++;
        } else {
            clearInterval(interval);
        }
    }, 10);
}

function generateUniqueId() {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
    return `
            <div class="wrapper ${isAi && 'ai'}">
                <div class="chat">
                    <div class="profile">
                        <img
                            src="${isAi ? bot : user}"
                            alt="${isAi ? 'bot' : 'user'}"
                        />
                    </div>
                    <div class="message" id="${uniqueId}">${value}</div>
                </div>
            <div>
        `;
}

async function handleSubmit(e) {
    e.preventDefault();

    const data = new FormData(form);
    const errorMessage = 'Something went wrong. Please try later!';

    if (data.get('prompt').trim() == '') return;

    // user's stripe
    chatContainer.innerHTML += chatStripe(false, data.get('prompt'));

    form.reset();

    // bot's stripe
    const uniqueId = generateUniqueId();
    chatContainer.innerHTML += chatStripe(true, ' ', uniqueId);

    // focus scroll to the bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const messageDiv = document.getElementById(uniqueId);

    loader(messageDiv);

    try {
        const response = await fetch(import.meta.env.VITE_API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: data.get('prompt'),
            }),
        });

        clearInterval(loadInterval);
        messageDiv.innerHTML = ' ';

        if (response.ok) {
            const data = await response.json();
            const parsedData = data.bot.trim(); // trims any trailing spaces/'\n'

            typeText(messageDiv, parsedData);
        } else {
            const error = await response.text();
            console.log('Error OpenAI API: ', error);
            messageDiv.innerHTML = errorMessage;
        }
    } catch (error) {
        clearInterval(loadInterval);
        messageDiv.innerHTML = errorMessage;
        console.log('Error: ', error);
    }
}

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        handleSubmit(e);
    }
});
btnClear.addEventListener('click', function () {
    chatContainer.textContent = '';
});
