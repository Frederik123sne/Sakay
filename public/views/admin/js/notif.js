function showNotification(message, type = 'success', duration = 3000) {
    const popup = document.getElementById('notificationPopup');
    const msg = document.getElementById('notificationMessage');

    if (!popup || !msg) return;

    msg.textContent = message;
    popup.className = 'notification-popup show ' + type;

    // Hide after duration
    setTimeout(() => {
        popup.classList.remove('show');
    }, duration);
}