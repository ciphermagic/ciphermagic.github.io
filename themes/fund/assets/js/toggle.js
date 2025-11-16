function setTheme(theme) {
    const lightCSS = document.getElementById(`hl-github-css`);
    const darkCSS = document.getElementById(`hl-github-dark-css`);
    const twLightCSS = document.getElementById(`twikoo-github-css`);
    const twDarkCSS = document.getElementById(`twikoo-github-dark-css`);

    if (theme === "dark") {
        lightCSS.disabled = true;
        darkCSS.disabled = false;
        twLightCSS.disabled = true;
        twDarkCSS.disabled = false;
    } else {
        lightCSS.disabled = false;
        darkCSS.disabled = true;
        twLightCSS.disabled = false;
        twDarkCSS.disabled = true;
    }
}

const savedTheme = localStorage.getItem("theme") || "dark";
if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
    setTheme("dark");
}

document.addEventListener("DOMContentLoaded", function () {
    // 获取保存的主题
    const savedTheme = localStorage.getItem("theme") || "light";
    // 应用主题
    document.body.classList.toggle("dark", savedTheme === "dark");
    // 更新图标状态
    document.getElementById("light-mode-icon").classList.toggle("active", savedTheme === "light");
    document.getElementById("dark-mode-icon").classList.toggle("active", savedTheme === "dark");

    document.getElementById("toggle-button").addEventListener("click", () => {
        const toTheme = document.body.className.includes("dark") ? "light" : "dark";
        if (document.body.className.includes("dark")) {
            document.body.classList.remove('dark');
            localStorage.setItem("theme", 'light');
            setTheme("light");
        } else {
            document.body.classList.add('dark');
            localStorage.setItem("theme", 'dark');
            setTheme("dark");
        }
        document.getElementById("light-mode-icon").classList.toggle("active", toTheme === "light");
        document.getElementById("dark-mode-icon").classList.toggle("active", toTheme === "dark");
    });
});