window.setMsg = (msg) => {
    const text = document.querySelector('#header-center-text');
    text.innerText = msg;
    const container = document.querySelector('.header-center-board');
    if (container.classList.contains('hidden')) {
        container.classList.replace('hidden', 'show');
    } else {
        container.classList.add('show');
    }
}

window.removeMsg = () => {
    const container = document.querySelector('.header-center-board');
    container.classList.replace('show', 'hidden');
}