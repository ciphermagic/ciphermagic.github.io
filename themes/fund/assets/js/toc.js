
document.addEventListener('DOMContentLoaded', () => {
    // 页面加载时计算每个标题的高度
    const sections = document.querySelectorAll('.post-content h2, h3, h4, h5, h6');
    sections.forEach((section, index) => {
        const nextSection = sections[index + 1];
        const sectionTop = section.offsetTop;
        const sectionBottom = nextSection ? nextSection.offsetTop : document.body.offsetHeight;
        section.dataset.top = sectionTop;
        section.dataset.bottom = sectionBottom;
    });

    // 计算标题所在的高度，用于控制目录的滚动
    const tocNodes = document.querySelectorAll('#TableOfContents a');

    // 获取:root元素的font-size
    const root = document.documentElement;
    const rootFontSize = window.getComputedStyle(root).fontSize;
    const rootFontSizePx = parseFloat(rootFontSize); // 将字符串转换为浮点数

    // 计算4rem对应的像素值
    const offsetPx = 4 * rootFontSizePx;

    document.addEventListener('scroll', () => {
        let current = '';

        let flag = false;
        sections.forEach((section) => {
            const sectionTop = parseFloat(section.dataset.top);
            const sectionBottom = parseFloat(section.dataset.bottom);

            // window.scrollY + offsetPx 这条线在块中间
            if (sectionBottom > window.scrollY + offsetPx && sectionTop <= window.scrollY + offsetPx) {
                if (!flag) {
                    const sectionId = section.id;
                    current = `#${sectionId}`;
                    flag = true;
                }
            } else {
                const link = document.querySelector(`a[href="#${section.id}"]`);
                if (link) {
                    link.classList.remove('active');
                }
            }
        });

        if (current === '' && sections.length > 1) {
            current = `#${sections[0].id}`
        }

        if (current) {
            let idx = 0;
            const activeLink = Array.from(tocNodes).find((link, index) => {
                if( decodeURIComponent(link.getAttribute('href')) === current ) {
                    idx = index;
                    return true;
                } else {
                    return false;
                }
            });

            if (activeLink) {
                activeLink.classList.add('active');
            }

            // 滚动目录区域的滚动条
            const tocContent = document.querySelector('.toc-content');
            console.log(tocContent.scrollHeight);
            tocContent.scrollTo({
                top: (idx/tocNodes.length) * tocContent.scrollHeight - 8 * rootFontSizePx,
                behavior: "smooth"
            });
        }
    })
});



