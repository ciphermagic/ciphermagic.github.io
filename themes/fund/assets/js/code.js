document.addEventListener("DOMContentLoaded", () => {

    // pre的默认样式
    document.querySelectorAll(".fund-code-container").forEach(code => {
        const codeBlock = code.querySelector("pre");
        const btn = code.querySelector(".fold-btn.open");
        if (btn) {
            codeBlock.classList.add("open"); // 展开内容
        }
    })

    document.querySelectorAll(".fold-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const pre = this.closest(".fund-code-container").querySelector("pre");
            if (pre.classList.contains("open")) {
                pre.classList.remove("open"); // 关闭内容
                 // 重置 max-height
                this.classList.remove("open"); // 按钮图标恢复原始状态
            } else {
                pre.classList.add("open"); // 展开内容
                 // 动态设置 max-height
                this.classList.add("open"); // 添加open类，触发旋转
            }
        });
    });

    document.querySelectorAll(".copy-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const pre = this.closest(".fund-code-container").querySelector("pre");
            let content = '';
            pre.querySelectorAll('.cl').forEach((cl) => {
                content += cl.innerText;
            })
            navigator.clipboard.writeText(content)
                .then(() => {
                    setMsg("Copied!");
                    setTimeout(removeMsg, 3000);
                })
                .catch(err => {
                    setMsg("Copied Failed!");
                    setTimeout(removeMsg, 3000);
                });
        });
    });
});
