let notificationCount = 0;
const notifications = new Set();

function showMessage(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'check_circle' : 
                type === 'error' ? 'error' : 
                'warning';
    notification.innerHTML = `
        <div class="notification-wrapper">
            <div class="notification-icon">
                <span class="material-icons-round">${icon}</span>
            </div>
            <div class="notification-content">
                <p>${message}</p>
            </div>
        </div>
    `;

    document.body.appendChild(notification);
    notifications.add(notification);
    
    updateNotificationsPosition();
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notifications.delete(notification);
            notification.remove();
            updateNotificationsPosition();
        }, 300);
    }, 3000);
}

function updateNotificationsPosition() {
    const notificationsArray = Array.from(notifications);
    for (let i = notificationsArray.length - 1; i >= 0; i--) {
        const notification = notificationsArray[i];
        const offset = 16 + (notificationsArray.length - 1 - i) * 70;
        notification.style.transition = 'all 0.3s ease-in-out';
        notification.style.bottom = `${offset}px`;
    }
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (response.ok) {
            showMessage('登录成功', 'success');
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('main-container').style.display = 'block';
            fetchCards();
        } else {
            showMessage('登录失败', 'error');
        }
    } catch (error) {
        showMessage('网络错误', 'error');
    }
}

async function fetchCards() {
    const response = await fetch('/api/cards');
    const cards = await response.json();
    const cardsDiv = document.getElementById('cards');
    cardsDiv.innerHTML = '';
    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-content';
        cardDiv.innerHTML = `
            <span>卡密: ${card.cardNumber}, 时间: ${card.time}</span>
            <button class="btn red lighten-1" onclick="deleteCard('${card.cardNumber}')">删除</button>
        `;
        cardsDiv.appendChild(cardDiv);
    });
}

async function addCard() {
    const cardNumber = document.getElementById('cardNumber').value;
    const time = parseInt(document.getElementById('time').value, 10);

    if (isNaN(time) || time < 0) {
        showMessage('时间必须是非负数', 'error');
        return;
    }

    try {
        const response = await fetch('/api/add-card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardNumber, time })
        });
        if (response.ok) {
            showMessage('卡密新增成功', 'success');
            fetchCards();
        } else {
            showMessage('新增失败', 'error');
        }
    } catch (error) {
        showMessage('网络错误', 'error');
    }
}

async function deleteCard(cardNumber) {
    try {
        const response = await fetch('/api/delete-card', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardNumber })
        });
        if (response.ok) {
            showMessage('卡密删除成功', 'success');
            fetchCards();
        } else {
            showMessage('删除失败', 'error');
        }
    } catch (error) {
        showMessage('网络错误', 'error');
    }
} 