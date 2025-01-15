   
   
   //   Realtime battery percentage of system

initBattery();

function initBattery() {
    const Bpercentages = document.querySelectorAll(".Bpercentage");
    navigator.getBattery().then((battery) => {
        updateBattery = () => {
            let level = Math.floor(battery.level * 100);
            Bpercentages.forEach(element => {
                element.innerHTML = level + "%";
            });
        };
        updateBattery();
        battery.addEventListener("levelchange", () => {
            updateBattery();
        });
        battery.addEventListener("chargingchange", () => {
            updateBattery();
        });
    });
}

   
// current time in system

let timeElements = document.querySelectorAll(".current-time");

setInterval(() => {
    let d = new Date();
    timeElements.forEach(element => {
        element.innerHTML = d.toLocaleTimeString();
    });
}, 1000);


// Chatbot service with integrated chatgpt API


const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
let userMessage = null; 
const API_KEY = "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"; 
const inputInitHeight = chatInput.scrollHeight;
const createChatLi = (message, className) => {
    
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", `${className}`);
    let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi; 
}
const generateResponse = (chatElement) => {
    const API_URL = "https://api.openai.com/v1/chat/completions";
    const messageElement = chatElement.querySelector("p");
   
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{role: "user", content: userMessage}],
        })
    }
    
    fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
        messageElement.textContent = data.choices[0].message.content.trim();
    }).catch(() => {
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong. Please try again.";
    }).finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
}
const handleChat = () => {
    userMessage = chatInput.value.trim(); 
    if(!userMessage) return;
   
    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;
    
    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);
    
    setTimeout(() => {
        
        const incomingChatLi = createChatLi("Thinking...", "incoming");
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
        generateResponse(incomingChatLi);
    }, 600);
}
chatInput.addEventListener("input", () => {
   
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});
chatInput.addEventListener("keydown", (e) => {
   
    if(e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleChat();
    }
});
sendChatBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));




//    Current weather data using weather API

const apiKey ="21780f6c669edbaec49e33ebcb0b6fbe";
const apiUrl= "https://api.openweathermap.org/data/2.5/weather?units=metric&q=bangalore ";

async function checkWeather(){
    const response = await fetch(apiUrl + `&appid=${apiKey}`);
    var data = await response.json();

    console.log(data);

       document.querySelector(".ui-card--value1").innerHTML = Math.round(data.main.temp) + "°c";
       document.querySelector(".ui-card--value2").innerHTML = data.main.humidity + "%";
       document.querySelector(".ui--detail-value1").innerHTML = Math.round(data.main.temp) + "°c";

}
checkWeather()


//   Cursor Animation

const cursorDot = document.querySelector("[data-cursor-dot]");
const cursorOutline = document.querySelector("[data-cursor-outline]");

window.addEventListener("mousemove", function (e){
    const posX = e.clientX;
    const posY = e.clientY;

    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;

    cursorOutline.animate({
        left: `${posX}px`,
        top: `${posY}px`
    }, { duration: 500, fill: "forwards"});
});
