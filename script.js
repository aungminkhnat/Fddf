const API_URL = "https://api.steinhq.com/v1/storages/6a5b569992b1163e971d8117/Sheet1";
let currentUser = null;

function getFormattedTime() {
    const now = new Date();
    return now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function generateShortId() {
    return 'ID-' + Math.floor(1000 + Math.random() * 9000);
}

function getLocalDepositHistory(phone) {
    try {
        const data = localStorage.getItem("my_deposits_" + phone);
        return data ? JSON.parse(data) : [];
    } catch(e) { return []; }
}

function saveLocalDepositHistory(phone, record) {
    let history = getLocalDepositHistory(phone);
    history.unshift(record);
    localStorage.setItem("my_deposits_" + phone, JSON.stringify(history));
}

// 👁️ Toggle Password Visibility Function
function togglePasswordVisibility(inputId, toggleIcon) {
    const passwordInput = document.getElementById(inputId);
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleIcon.innerText = "🙈"; 
    } else {
        passwordInput.type = "password";
        toggleIcon.innerText = "👁️"; 
    }
}

// 🛑 Screen Switcher
function switchScreen(screenName) {
    const authSec = document.getElementById('auth-section');
    const bannedSec = document.getElementById('ban-screen');
    const dashSec = document.getElementById('dashboard-section');

    if(authSec) authSec.classList.add('hidden');
    if(bannedSec) bannedSec.classList.add('hidden');
    if(dashSec) dashSec.classList.add('hidden');

    if (screenName === 'auth' && authSec) {
        authSec.classList.remove('hidden');
    } else if (screenName === 'banned' && bannedSec) {
        bannedSec.classList.remove('hidden');
    } else if (screenName === 'dashboard' && dashSec) {
        dashSec.classList.remove('hidden');
    }
}

window.onload = async function() {
    const savedUser = localStorage.getItem("gameUser");
    if (savedUser) {
        const tempUser = JSON.parse(savedUser);
        try {
            const response = await fetch(`${API_URL}?search={"phone":"${tempUser.phone}"}`);
            const data = await response.json();
            currentUser = data.length > 0 ? data[0] : tempUser;
            localStorage.setItem("gameUser", JSON.stringify(currentUser));
            
            if (currentUser.status === "banned") {
                showBanScreen();
            } else {
                openDashboard();
            }
        } catch (e) {
            currentUser = tempUser;
            if (currentUser.status === "banned") {
                showBanScreen();
            } else {
                openDashboard();
            }
        }
    } else {
        switchScreen('auth');
    }
};

function showBanScreen() {
    switchScreen('banned');
    document.getElementById('banned-user-name').innerText = currentUser.user || 'Player Name';
    document.getElementById('banned-user-phone').innerText = currentUser.phone || '09xxxxxxxxx';
    document.getElementById('banned-money').innerText = currentUser.money || 0;
    document.getElementById('banned-points').innerText = currentUser.points || 0;
    document.getElementById('banned-coins').innerText = currentUser.coins || 0;
    showMsg('', false);
}

async function handleLogin(e) {
    e.preventDefault();
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-pass').value;
    showMsg("စစ်ဆေးနေပါသည်...", false);
    try {
        const response = await fetch(`${API_URL}?search={"phone":"${phone}"}`);
        const users = await response.json();
        if(users.length > 0 && String(users[0].pass) === String(password)) {
            currentUser = users[0];
            localStorage.setItem("gameUser", JSON.stringify(currentUser));
            if (currentUser.status === "banned") {
                showBanScreen();
            } else {
                openDashboard();
            }
        } else { 
            showMsg("ဖုန်းနံပါတ် သို့မဟုတ် Password မှားယွင်းနေပါသည်။", false, true); 
        }
    } catch (err) { 
        showMsg("ချိတ်ဆက်မှု မအောင်မြင်ပါ", false, true); 
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const phone = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-pass').value;
    showMsg("စစ်ဆေးနေပါသည်...", false);
    try {
        const chk = await fetch(`${API_URL}?search={"phone":"${phone}"}`);
        const resChk = await chk.json();
        if (resChk.length > 0) { 
            showMsg("❌ ဤဖုန်းဖြင့် ဖွင့်ထားပြီးသား ဖြစ်ပါသည်။", false, true); 
            return; 
        }
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([{ user: name, phone: phone, pass: password, money: 0, points: 0, coins: 0, status: "active" }])
        });
        if(response.ok) { 
            showMsg("✅ အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။", true); 
            e.target.reset(); 
            switchTab('login'); 
        }
    } catch (err) { 
        showMsg("ချိတ်ဆက်မှု မအောင်မြင်ပါ", false, true); 
    }
}

function openDashboard() {
    switchScreen('dashboard');
    document.getElementById('dash-user-name').innerText = currentUser.user || 'Player Name';
    document.getElementById('dash-user-phone').innerText = currentUser.phone || '09xxxxxxxxx';
    updateUI();
}

function updateUI() {
    document.getElementById('dash-money').innerText = currentUser.money || 0;
    document.getElementById('dash-points').innerText = currentUser.points || 0;
    document.getElementById('dash-coins').innerText = currentUser.coins || 0;
}

async function playLuckyDraw(times) {
    let cost = times === 5 ? 500 : 1000;
    let reward = times === 5 ? 2566 : 5134;
    const resDiv = document.getElementById('game-status-msg');
    const wheel = document.getElementById('wheel-icon');
    if (parseInt(currentUser.money) < cost) { 
        resDiv.innerHTML = "<span style='color: #ef4444;'>❌ လက်ကျန်ငွေမလုံလောက်ပါ။</span>"; 
        return; 
    }
    document.getElementById('spin-5x-btn').disabled = true; 
    document.getElementById('spin-10x-btn').disabled = true;
    resDiv.innerText = "မဲနှိုက်နေသည်... 🎡"; 
    wheel.style.transform = "rotate(720deg)";
    
    const newM = parseInt(currentUser.money) - cost; 
    const newP = parseInt(currentUser.points || 0) + reward;
    try {
        const res = await fetch(API_URL, { 
            method: "PUT", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ condition: { phone: currentUser.phone }, set: { money: newM, points: newP } }) 
        });
        if (res.ok) {
            currentUser.money = newM; 
            currentUser.points = newP; 
            localStorage.setItem("gameUser", JSON.stringify(currentUser)); 
            updateUI();
            setTimeout(() => { 
                wheel.style.transform = "rotate(0deg)"; 
                resDiv.innerHTML = `<span style='color: #10b981;'>🎉 ရမှတ် ${reward} Points ရရှိပါသည်!</span>`; 
                document.getElementById('spin-5x-btn').disabled = false; 
                document.getElementById('spin-10x-btn').disabled = false; 
            }, 1000);
        }
    } catch (e) { 
        document.getElementById('spin-5x-btn').disabled = false; 
        document.getElementById('spin-10x-btn').disabled = false; 
    }
}

async function exchangePointsToCoins() {
    const curP = parseInt(currentUser.points || 0);
    if (curP < 7700) { 
        showMsg("❌ Points မလုံလောက်ပါ။", false, true); 
        return; 
    }
    showMsg("Coins သို့ လဲလှယ်နေပါသည်...", false);
    const newP = curP - 7700; 
    const newC = parseInt(currentUser.coins || 0) + 1000;
    try {
        const res = await fetch(API_URL, { 
            method: "PUT", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ condition: { phone: currentUser.phone }, set: { points: newP, coins: newC } }) 
        });
        if (res.ok) { 
            currentUser.points = newP; 
            currentUser.coins = newC; 
            localStorage.setItem("gameUser", JSON.stringify(currentUser)); 
            updateUI(); 
            showMsg("✅ Coins 1000 လဲလှယ်ခြင်း အောင်မြင်ပါသည်!", true); 
        }
    } catch (err) { 
        showMsg("လဲလှယ်မှု မအောင်မြင်ပါ", false, true); 
    }
}

async function handleCodeAndAmountDeposit(e) {
    e.preventDefault();
    const code = document.getElementById('deposit-code').value.trim();
    const amt = parseInt(document.getElementById('deposit-amount').value);
    showMsg("တောင်းဆိုမှုကို ပေးပို့နေပါသည်...", false);

    const generatedId = generateShortId();
    const currentTime = getFormattedTime();

    const newRecord = {
        id: generatedId,
        time: currentTime,
        amount: amt,
        code: code,
        status: "စစ်ဆေးနေသည်"
    };
    saveLocalDepositHistory(currentUser.phone, newRecord);

    try {
        await fetch(API_URL, { 
            method: "PUT", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ 
                condition: { phone: currentUser.phone }, 
                set: { 
                    code: code, 
                    amount: amt, 
                    deposit_id: generatedId, 
                    deposit_time: currentTime, 
                    deposit_status: "စစ်ဆေးနေသည်"
                } 
            }) 
        });

        currentUser.deposit_id = generatedId;
        currentUser.deposit_time = currentTime;
        currentUser.amount = amt;
        currentUser.deposit_status = "စစ်ဆေးနေသည်";
        localStorage.setItem("gameUser", JSON.stringify(currentUser));

        showMsg("✅ ငွေဖြည့်ရန် တောင်းဆိုမှု အောင်မြင်ပါသည်။", true); 
        document.getElementById('deposit-box').classList.add('hidden'); 
        e.target.reset(); 
    } catch (e) { 
        showMsg("✅ Local တွင် မှတ်တမ်းတင်ပြီးပါပြီ။", true); 
        document.getElementById('deposit-box').classList.add('hidden'); 
        e.target.reset(); 
    }
}

async function requestWithdraw(playerPhone, amountToWithdraw) {
    const generatedId = generateShortId();
    const currentTime = getFormattedTime();
    const newCoins = parseInt(currentUser.coins || 0) - parseInt(amountToWithdraw);

    try {
        const response = await fetch(API_URL, {
            method: "PUT", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                condition: { phone: String(playerPhone) }, 
                set: { 
                    withdraw_amount: String(amountToWithdraw),
                    withdraw_phone: String(playerPhone),
                    withdraw_id: String(generatedId),
                    withdraw_time: String(currentTime),
                    coins: newCoins 
                } 
            })
        });

        if(response.ok) {
            currentUser.coins = newCoins;
            localStorage.setItem("gameUser", JSON.stringify(currentUser));
            updateUI();
            alert("✅ Coins ထုတ်ရန် တောင်းဆိုမှု အောင်မြင်ပါသည်။");
            document.getElementById('withdraw-box').classList.add('hidden');
        } else {
            alert("❌ တောင်းဆိုမှု မအောင်မြင်ပါ။");
        }
    } catch (error) {
        alert("⚠️ လိုင်းမကောင်းပါ။");
    }
}

async function handleCoinsWithdraw(e) {
    e.preventDefault();
    const amt = document.getElementById('withdraw-select-coins').value;
    if (parseInt(currentUser.coins || 0) < parseInt(amt)) { 
        alert("❌ Coins မလုံလောက်ပါ။"); 
        return; 
    }
    await requestWithdraw(currentUser.phone, amt);
    e.target.reset();
}

async function openHistoryModal() {
    const modal = document.getElementById('history-modal');
    modal.classList.remove('hidden');
    
    let user = currentUser;
    try {
        const res = await fetch(`${API_URL}?search={"phone":"${currentUser.phone}"}`);
        const data = await res.json();
        if(data.length > 0) {
            user = data[0];
            currentUser = user;
            localStorage.setItem("gameUser", JSON.stringify(currentUser));
            updateUI();
        }
    } catch (e) {}

    let buyId = user.buy_id || "N/A"; 
    let buyTime = user.buy_time || "ရှေးဟောင်းမှတ်တမ်း";
    document.getElementById('buy-history-body').innerHTML = user.buy_item ? `<tr><td><span style='color:var(--text-muted); font-size:10px;'>${buyId}</span><br>${buyTime}</td><td><b>${user.buy_item}</b></td><td>${user.buy_price || 0} Ks</td></tr>` : `<tr><td colspan="3">မှတ်တမ်းမရှိပါ</td></tr>`;

    let localList = getLocalDepositHistory(user.phone);
    let depositHTML = "";
    let currentDbStatus = user.deposit_status || "စစ်ဆေးနေသည်";
    let isApproved = ["approved", "success", "completed", "သွင်းပြီးပါပြီ", "လက်ခံထားသည်"].includes(currentDbStatus);

    if (localList.length > 0) {
        localList.forEach((item, index) => {
            if (isApproved && index === 0) {
                item.status = "သွင်းပြီးပါပြီ";
            }
            let statusBadge = (item.status === "သွင်းပြီးပါပြီ" || item.status === "approved" || item.status === "လက်ခံထားသည်") 
                ? `<span class="status-badge status-success">✅ သွင်းပြီးပါပြီ</span>` 
                : `<span class="status-badge status-pending">⏳ ${item.status || "စစ်ဆေးနေသည်"}</span>`;

            depositHTML += `<tr>
                <td><span style='color:var(--text-muted); font-size:10px;'>${item.id}</span><br>${item.time}</td>
                <td><b>${item.amount} Ks</b></td>
                <td>${statusBadge}</td>
            </tr>`;
        });
        localStorage.setItem("my_deposits_" + user.phone, JSON.stringify(localList));
    } else if (user.deposit_id && user.amount) {
        let statusBadge = isApproved 
            ? `<span class="status-badge status-success">✅ သွင်းပြီးပါပြီ</span>` 
            : `<span class="status-badge status-pending">⏳ စစ်ဆေးနေသည်</span>`;
        depositHTML = `<tr><td><span style='color:var(--text-muted); font-size:10px;'>${user.deposit_id}</span><br>${user.deposit_time}</td><td><b>${user.amount} Ks</b></td><td>${statusBadge}</td></tr>`;
    } else {
        depositHTML = `<tr><td colspan="3">မှတ်တမ်းမရှိပါ</td></tr>`;
    }

    document.getElementById('deposit-history-body').innerHTML = depositHTML;
    
    let witId = user.withdraw_id || "N/A"; 
    let witTime = user.withdraw_time || "N/A";
    document.getElementById('withdraw-history-body').innerHTML = user.withdraw_amount ? `<tr><td><span style='color:var(--text-muted); font-size:10px;'>${witId}</span><br>${witTime}</td><td><b>${user.withdraw_amount} Coins</b></td><td>${user.withdraw_phone}</td></tr>` : `<tr><td colspan="3">မှတ်တမ်းမရှိပါ</td></tr>`;
}

function closeHistoryModal() {
    document.getElementById('history-modal').classList.add('hidden');
}

function toggleDepositBox() { document.getElementById('deposit-box').classList.toggle('hidden'); }
function toggleWithdrawBox() { document.getElementById('withdraw-box').classList.toggle('hidden'); }

function switchTab(type) { 
    if(type === 'login'){ 
        document.getElementById('login-form').classList.remove('hidden'); 
        document.getElementById('signup-form').classList.add('hidden'); 
        document.getElementById('tab-login-btn').classList.add('active');
        document.getElementById('tab-signup-btn').classList.remove('active');
    } else { 
        document.getElementById('login-form').classList.add('hidden'); 
        document.getElementById('signup-form').classList.remove('hidden'); 
        document.getElementById('tab-login-btn').classList.remove('active');
        document.getElementById('tab-signup-btn').classList.add('active');
    } 
}

function logout() { 
    localStorage.removeItem("gameUser"); 
    currentUser = null; 
    window.location.reload(); 
}

function showMsg(text, isSuccess, isError=false) { 
    const m = document.getElementById('global-msg'); 
    if(!text){ m.classList.add('hidden'); return; } 
    m.classList.remove('hidden', 'msg-success', 'msg-error'); 
    m.innerText = text; 
    if(isSuccess) m.classList.add('msg-success'); 
    if(isError) m.classList.add('msg-error'); 
}
