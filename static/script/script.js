const firebaseConfig = {
    apiKey: "AIzaSyAKZqOwC-jRgDdWnE5Dc8rfxP5vlPaWIjs",
    authDomain: "fraud-detector-92fd4.firebaseapp.com",
    projectId: "fraud-detector-92fd4",
    storageBucket: "fraud-detector-92fd4.firebasestorage.app",
    messagingSenderId: "994132224992",
    appId: "1:994132224992:web:02d68a381c5ba876c25985"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
var selectedItems = new Set();

var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
tooltipTriggerList.map(function (el) {
    return new bootstrap.Tooltip(el);
});

function updateAuthUI(user) {
    var authSection = document.getElementById('authSection');
    if (user) {
        var initial = user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
        authSection.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown">
                    <div class="user-avatar">${initial}</div>
                    <span class="d-none d-sm-inline">${user.displayName || user.email.split('@')[0]}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#historyModal"><i class="fas fa-history me-2"></i>History</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                </ul>
            </div>
        `;
        document.getElementById('logoutBtn').addEventListener('click', function (e) {
            e.preventDefault();
            auth.signOut();
        });
    } else {
        authSection.innerHTML = `
            <button class="btn btn-outline-primary btn-sm" data-bs-toggle="modal" data-bs-target="#authModal" id="loginBtn">
                <i class="fas fa-sign-in-alt"></i> <span class="d-none d-sm-inline">Login</span>
            </button>
        `;
    }
}

auth.onAuthStateChanged(function (user) {
    updateAuthUI(user);
    if (user) {
        var resultCard = document.getElementById('resultCard');
        if (resultCard) {
            saveToHistory({
                score: resultCard.dataset.score,
                risk: resultCard.dataset.risk,
                amount: resultCard.dataset.amount,
                factors: resultCard.dataset.factors,
                timestamp: new Date().toISOString()
            });
        }
    }
});

function showAuthError(msg) {
    var el = document.getElementById('authError');
    el.textContent = msg;
    el.classList.remove('d-none');
    document.getElementById('authSuccess').classList.add('d-none');
}

function showAuthSuccess(msg) {
    var el = document.getElementById('authSuccess');
    el.textContent = msg;
    el.classList.remove('d-none');
    document.getElementById('authError').classList.add('d-none');
}

function hideAuthAlerts() {
    document.getElementById('authError').classList.add('d-none');
    document.getElementById('authSuccess').classList.add('d-none');
}

document.getElementById('showRegister').addEventListener('click', function (e) {
    e.preventDefault();
    hideAuthAlerts();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authModalTitle').innerHTML = '<i class="fas fa-user-plus text-success"></i> Register';
});

document.getElementById('showLogin').addEventListener('click', function (e) {
    e.preventDefault();
    hideAuthAlerts();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('authModalTitle').innerHTML = '<i class="fas fa-user-circle text-primary"></i> Login';
});

document.getElementById('loginSubmit').addEventListener('click', function () {
    var email = document.getElementById('loginEmail').value;
    var password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showAuthError('Please fill in all fields');
        return;
    }

    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

    auth.signInWithEmailAndPassword(email, password)
        .then(function () {
            bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
        })
        .catch(function (error) {
            showAuthError(error.message);
        })
        .finally(function () {
            document.getElementById('loginSubmit').disabled = false;
            document.getElementById('loginSubmit').innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        });
});

document.getElementById('registerSubmit').addEventListener('click', function () {
    var name = document.getElementById('registerName').value;
    var email = document.getElementById('registerEmail').value;
    var password = document.getElementById('registerPassword').value;

    if (!name || !email || !password) {
        showAuthError('Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showAuthError('Password must be at least 6 characters');
        return;
    }

    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

    auth.createUserWithEmailAndPassword(email, password)
        .then(function (userCredential) {
            return userCredential.user.updateProfile({ displayName: name });
        })
        .then(function () {
            bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
            document.getElementById('registerName').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
        })
        .catch(function (error) {
            showAuthError(error.message);
        })
        .finally(function () {
            document.getElementById('registerSubmit').disabled = false;
            document.getElementById('registerSubmit').innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        });
});

function getHistoryRef() {
    var user = auth.currentUser;
    if (!user) return null;
    return db.collection('users').doc(user.uid).collection('history');
}

function saveToHistory(entry) {
    var historyRef = getHistoryRef();
    if (!historyRef) return;

    historyRef.add({
        score: entry.score,
        risk: entry.risk,
        amount: entry.amount,
        factors: entry.factors,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString()
    }).catch(function(error) {
        console.error('Error saving history:', error);
    });
}

async function loadHistory() {
    var historyRef = getHistoryRef();
    if (!historyRef) return [];

    try {
        var snapshot = await historyRef.orderBy('timestamp', 'desc').limit(50).get();
        var history = [];
        snapshot.forEach(function(doc) {
            var data = doc.data();
            data.id = doc.id;
            history.push(data);
        });
        return history;
    } catch (error) {
        console.error('Error loading history:', error);
        return [];
    }
}

async function renderHistory() {
    var listEl = document.getElementById('historyList');
    var emptyEl = document.getElementById('historyEmpty');
    var loadingEl = document.getElementById('historyLoading');

    selectedItems.clear();
    updateSelectionUI();

    loadingEl.style.display = 'block';
    emptyEl.style.display = 'none';
    listEl.innerHTML = '';

    var history = await loadHistory();

    loadingEl.style.display = 'none';

    if (history.length === 0) {
        emptyEl.style.display = 'block';
        return;
    }

    emptyEl.style.display = 'none';
    listEl.innerHTML = history.map(function (h) {
        var date = h.timestamp ? h.timestamp.toDate() : new Date(h.createdAt);
        var dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        var timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        var riskClass = h.risk.toLowerCase();
        var riskColor = riskClass === 'high' ? 'danger' : (riskClass === 'medium' ? 'warning' : 'success');

        return `
            <div class="history-item risk-${riskClass}" data-id="${h.id}">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-2">
                        <input type="checkbox" class="form-check-input history-checkbox" data-id="${h.id}">
                        <div>
                            <span class="badge bg-${riskColor}">${h.risk} Risk</span>
                            <span class="ms-2 text-muted small">${dateStr} at ${timeStr}</span>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <div class="history-score text-${riskColor}">${h.score}%</div>
                        <button class="btn btn-sm btn-outline-danger history-delete-btn" data-id="${h.id}" title="Delete">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="mt-2 small text-muted ps-4">
                    <i class="fas fa-rupee-sign"></i> ${parseFloat(h.amount).toLocaleString('en-IN')}
                    <span class="ms-3"><i class="fas fa-exclamation-triangle"></i> ${h.factors} risk factors</span>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.history-checkbox').forEach(function(cb) {
        cb.addEventListener('change', function() {
            var id = this.dataset.id;
            var item = this.closest('.history-item');
            if (this.checked) {
                selectedItems.add(id);
                item.classList.add('selected');
            } else {
                selectedItems.delete(id);
                item.classList.remove('selected');
            }
            updateSelectionUI();
        });
    });

    document.querySelectorAll('.history-delete-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = this.dataset.id;
            if (confirm('Delete this history entry?')) {
                deleteHistoryItem(id);
            }
        });
    });
}

function updateSelectionUI() {
    var count = selectedItems.size;
    var deleteBtn = document.getElementById('deleteSelected');
    var countEl = document.getElementById('selectedCount');

    countEl.textContent = count;
    deleteBtn.style.display = count > 0 ? 'inline-block' : 'none';
}

async function deleteHistoryItem(id) {
    var historyRef = getHistoryRef();
    if (!historyRef) return;

    try {
        await historyRef.doc(id).delete();
        var item = document.querySelector('.history-item[data-id="' + id + '"]');
        if (item) {
            item.remove();
        }
        selectedItems.delete(id);
        updateSelectionUI();

        var listEl = document.getElementById('historyList');
        if (listEl.children.length === 0) {
            document.getElementById('historyEmpty').style.display = 'block';
        }
    } catch (error) {
        console.error('Error deleting:', error);
        alert('Error deleting entry');
    }
}

async function deleteSelectedItems() {
    if (selectedItems.size === 0) return;

    var historyRef = getHistoryRef();
    if (!historyRef) return;

    var batch = db.batch();
    selectedItems.forEach(function(id) {
        batch.delete(historyRef.doc(id));
    });

    try {
        await batch.commit();
        await renderHistory();
    } catch (error) {
        console.error('Error deleting selected:', error);
        alert('Error deleting entries');
    }
}

async function clearAllHistory() {
    var historyRef = getHistoryRef();
    if (!historyRef) return;

    try {
        var snapshot = await historyRef.get();
        var batch = db.batch();
        snapshot.forEach(function(doc) {
            batch.delete(doc.ref);
        });
        await batch.commit();
        await renderHistory();
    } catch (error) {
        console.error('Error clearing history:', error);
        alert('Error clearing history');
    }
}

document.getElementById('historyModal').addEventListener('show.bs.modal', renderHistory);

document.getElementById('clearHistory').addEventListener('click', function () {
    if (confirm('Are you sure you want to clear ALL history? This cannot be undone.')) {
        clearAllHistory();
    }
});

document.getElementById('deleteSelected').addEventListener('click', function () {
    if (confirm('Delete ' + selectedItems.size + ' selected items?')) {
        deleteSelectedItems();
    }
});

document.getElementById('selectAllHistory').addEventListener('click', function () {
    var checkboxes = document.querySelectorAll('.history-checkbox');
    var allSelected = selectedItems.size === checkboxes.length && checkboxes.length > 0;

    checkboxes.forEach(function(cb) {
        cb.checked = !allSelected;
        var id = cb.dataset.id;
        var item = cb.closest('.history-item');

        if (!allSelected) {
            selectedItems.add(id);
            item.classList.add('selected');
        } else {
            selectedItems.delete(id);
            item.classList.remove('selected');
        }
    });

    updateSelectionUI();
    this.innerHTML = allSelected ?
        '<i class="fas fa-check-double"></i> Select All' :
        '<i class="fas fa-times"></i> Deselect All';
});

document.querySelectorAll('.risk-check').forEach(function (item) {
    item.addEventListener('click', function () {
        var checkbox = this.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        this.classList.toggle('active', checkbox.checked);
        this.querySelector('.check-icon').style.display = checkbox.checked ? 'inline' : 'none';
        this.querySelector('.uncheck-icon').style.display = checkbox.checked ? 'none' : 'inline';
    });
});

var form = document.getElementById('fraudForm');
if (form) {
    form.addEventListener('submit', function () {
        var btn = document.getElementById('submitBtn');
        var btnText = document.getElementById('btnText');
        var btnIcon = document.getElementById('btnIcon');
        btn.disabled = true;
        btnIcon.className = 'fas fa-spinner fa-spin';
        var steps = ['Loading Model', 'Building Vectors', 'Running Analysis', 'Calculating Risk'];
        var i = 0;
        setInterval(function () {
            if (i < steps.length) {
                btnText.textContent = steps[i] + '...';
                i++;
            }
        }, 400);
    });
}

var using12HourFormat = true;
var toggleFormatBtn = document.getElementById('toggleFormat');

function toggleTimeFormat() {
    using12HourFormat = !using12HourFormat;
    var time12 = document.querySelector('.time-input-12hour');
    var time24 = document.querySelector('.time-input-24hour');

    if (using12HourFormat) {
        time12.style.display = 'block';
        time24.style.display = 'none';
        toggleFormatBtn.textContent = 'Switch to 24-hour format';
        convert24To12();
    } else {
        time12.style.display = 'none';
        time24.style.display = 'block';
        toggleFormatBtn.textContent = 'Switch to 12-hour format';
        convert12To24();
    }
}

function convert12To24() {
    var hours12 = parseInt(document.getElementById('convHours12').value) || 12;
    var minutes = parseInt(document.getElementById('convMinutes12').value) || 0;
    var seconds = parseInt(document.getElementById('convSeconds12').value) || 0;
    var ampm = document.getElementById('convAmPm').value;

    var hours24 = hours12;
    if (ampm === 'AM' && hours12 === 12) {
        hours24 = 0;
    } else if (ampm === 'PM' && hours12 !== 12) {
        hours24 = hours12 + 12;
    }

    document.getElementById('convHours24').value = hours24;
    document.getElementById('convMinutes24').value = minutes;
    document.getElementById('convSeconds24').value = seconds;
}

function convert24To12() {
    var hours24 = parseInt(document.getElementById('convHours24').value) || 0;
    var minutes = parseInt(document.getElementById('convMinutes24').value) || 0;
    var seconds = parseInt(document.getElementById('convSeconds24').value) || 0;

    var hours12 = hours24;
    var ampm = 'AM';

    if (hours24 === 0) {
        hours12 = 12;
        ampm = 'AM';
    } else if (hours24 === 12) {
        hours12 = 12;
        ampm = 'PM';
    } else if (hours24 > 12) {
        hours12 = hours24 - 12;
        ampm = 'PM';
    } else {
        ampm = 'AM';
    }

    document.getElementById('convHours12').value = hours12;
    document.getElementById('convMinutes12').value = minutes;
    document.getElementById('convSeconds12').value = seconds;
    document.getElementById('convAmPm').value = ampm;
}

function calculateSeconds() {
    var hours, minutes, seconds;
    var humanTime = "";

    if (using12HourFormat) {
        convert12To24();
        hours = parseInt(document.getElementById('convHours24').value) || 0;
        minutes = parseInt(document.getElementById('convMinutes24').value) || 0;
        seconds = parseInt(document.getElementById('convSeconds24').value) || 0;

        var hours12 = parseInt(document.getElementById('convHours12').value) || 12;
        var ampm = document.getElementById('convAmPm').value;
        humanTime = hours12 + ":" +
            minutes.toString().padStart(2, '0') + ":" +
            seconds.toString().padStart(2, '0') + " " + ampm;
    } else {
        hours = parseInt(document.getElementById('convHours24').value) || 0;
        minutes = parseInt(document.getElementById('convMinutes24').value) || 0;
        seconds = parseInt(document.getElementById('convSeconds24').value) || 0;

        humanTime = hours.toString().padStart(2, '0') + ":" +
            minutes.toString().padStart(2, '0') + ":" +
            seconds.toString().padStart(2, '0');
    }

    hours = Math.max(0, Math.min(23, hours));
    minutes = Math.max(0, Math.min(59, minutes));
    seconds = Math.max(0, Math.min(59, seconds));

    var total = (hours * 3600) + (minutes * 60) + seconds;
    document.getElementById('convResult').textContent = total.toLocaleString();
    document.getElementById('humanTime').textContent = humanTime;
    return total;
}

document.getElementById('toggleFormat').addEventListener('click', function (e) {
    e.preventDefault();
    toggleTimeFormat();
    calculateSeconds();
});

['convHours12', 'convMinutes12', 'convSeconds12', 'convAmPm',
    'convHours24', 'convMinutes24', 'convSeconds24'].forEach(function (id) {
        var element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', calculateSeconds);
            element.addEventListener('change', calculateSeconds);
        }
    });

document.getElementById('convertBtn').addEventListener('click', calculateSeconds);
document.getElementById('useTimeBtn').addEventListener('click', function () {
    var total = calculateSeconds();
    document.getElementById('timeInput').value = total;
    var modal = bootstrap.Modal.getInstance(document.getElementById('timeConverterModal'));
    modal.hide();
});

calculateSeconds();
