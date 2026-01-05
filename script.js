const questions = [
    {
        question: "Vad betyder ABS i en bil?",
        answers: ["Anti-lock Braking System", "Automatic Braking System", "Advanced Breaking System", "Air Bag System"],
        correct: 0
    },
    {
        question: "Vilket företag tillverkar Mustang?",
        answers: ["Chevrolet", "Ford", "Dodge", "Tesla"],
        correct: 1
    },
    {
        question: "Vad står VW för?",
        answers: ["Volvo Works", "Volkswagen", "Victory Wheels", "Vehicle World"],
        correct: 1
    },
    {
        question: "Vilket år grundades Ferrari?",
        answers: ["1929", "1939", "1947", "1955"],
        correct: 2
    },
    {
        question: "Vad kallas en bil med tre volymer?",
        answers: ["Sedan", "Kombi", "SUV", "Coupé"],
        correct: 0
    },
    {
        question: "Vilken bil är känd som 'people's car'?",
        answers: ["Ford Model T", "VW Beetle", "Mini Cooper", "Fiat 500"],
        correct: 1
    },
    {
        question: "Vad mäts i hästkrafter?",
        answers: ["Hastighet", "Effekt", "Vikt", "Bränsleförbrukning"],
        correct: 1
    },
    {
        question: "Vilket land tillverkar Volvo bilar?",
        answers: ["Norge", "Danmark", "Sverige", "Finland"],
        correct: 2
    },
    {
        question: "Vad står RPM för?",
        answers: ["Rotations Per Minut", "Race Power Mode", "Road Performance Meter", "Rapid Power Motor"],
        correct: 0
    },
    {
        question: "Vilken bilmärke har en treuddig stjärna som logga?",
        answers: ["BMW", "Audi", "Mercedes-Benz", "Volvo"],
        correct: 2
    },
    {
        question: "Vad är en hybrid-bil?",
        answers: ["En bil med två motorer", "En bil med bensin och elmotor", "En bil med diesel", "En sportig bil"],
        correct: 1
    },
    {
        question: "Vilket företag äger Lamborghini?",
        answers: ["Ferrari", "Volkswagen Group", "Fiat", "BMW"],
        correct: 1
    },
    {
        question: "Vad är maximala hastigheten på tyska Autobahn?",
        answers: ["120 km/h", "150 km/h", "200 km/h", "Ingen gräns på vissa sträckor"],
        correct: 3
    },
    {
        question: "Vilket bränsle använder en dieselmotor?",
        answers: ["Bensin", "Diesel", "Etanol", "Gas"],
        correct: 1
    },
    {
        question: "Vad betyder AWD?",
        answers: ["All Wheel Drive", "Automatic Wind Down", "Advanced Wheel Design", "Active Warning Device"],
        correct: 0
    }
];

let currentQuestion = 0;
let score = 0;
let timeLeft = 60;
let timerInterval = null;
let usedQuestions = [];

// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const questionEl = document.getElementById('question');
const answersEl = document.getElementById('answers');
const scoreEl = document.getElementById('score');
const timeLeftEl = document.getElementById('time-left');
const finalScoreEl = document.getElementById('final-score');
const resultMessageEl = document.getElementById('result-message');

// Event Listeners
startBtn.addEventListener('click', startQuiz);
restartBtn.addEventListener('click', restartQuiz);

function startQuiz() {
    // Clear any existing timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Reset variables
    currentQuestion = 0;
    score = 0;
    timeLeft = 60;
    usedQuestions = [];
    
    // Update UI
    scoreEl.textContent = score;
    timeLeftEl.textContent = timeLeft;
    
    // Switch screens
    startScreen.classList.remove('active');
    quizScreen.classList.add('active');
    
    // Start timer
    timerInterval = setInterval(updateTimer, 1000);
    
    // Load first question
    loadQuestion();
}

function updateTimer() {
    timeLeft--;
    timeLeftEl.textContent = timeLeft;
    
    if (timeLeft <= 0) {
        endQuiz();
    }
}

function loadQuestion() {
    // Get random question that hasn't been used
    let availableQuestions = questions.filter((q, index) => !usedQuestions.includes(index));
    
    if (availableQuestions.length === 0) {
        // All questions used, reset pool
        usedQuestions = [];
        availableQuestions = questions;
    }
    
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const question = availableQuestions[randomIndex];
    const questionIndex = questions.indexOf(question);
    usedQuestions.push(questionIndex);
    
    // Display question
    questionEl.textContent = question.question;
    
    // Clear previous answers
    answersEl.innerHTML = '';
    
    // Display answers
    question.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.textContent = answer;
        button.classList.add('answer-btn');
        button.addEventListener('click', () => selectAnswer(index, question.correct, button));
        answersEl.appendChild(button);
    });
}

function selectAnswer(selected, correct, button) {
    // Disable all buttons
    const buttons = answersEl.querySelectorAll('.answer-btn');
    buttons.forEach(btn => btn.disabled = true);
    
    if (selected === correct) {
        button.classList.add('correct');
        score++;
        scoreEl.textContent = score;
    } else {
        button.classList.add('wrong');
        // Show correct answer
        buttons[correct].classList.add('correct');
    }
    
    // Load next question after delay
    setTimeout(() => {
        loadQuestion();
    }, 1000);
}

function endQuiz() {
    // Clear timer
    clearInterval(timerInterval);
    
    // Switch screens
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');
    
    // Display final score
    finalScoreEl.textContent = score;
    
    // Display message based on score
    let message = '';
    if (score >= 15) {
        message = 'Fantastiskt! Du är en riktig bilexpert! 🏆';
    } else if (score >= 10) {
        message = 'Bra jobbat! Du har goda kunskaper om bilar! 👍';
    } else if (score >= 5) {
        message = 'Inte dåligt! Det finns mer att lära. 📚';
    } else {
        message = 'Fortsätt öva, så blir du bättre! 💪';
    }
    resultMessageEl.textContent = message;
}

function restartQuiz() {
    // Clear any existing timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Reset screens
    resultScreen.classList.remove('active');
    startScreen.classList.add('active');
}
