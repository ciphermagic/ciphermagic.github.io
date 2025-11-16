document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('.chirp-comments-btn').forEach(comment => {
        comment.addEventListener('click', function() {
            const container = this.closest(".chirp-container");
            const commentBlock = container.querySelector('.chirp-comments');
            if (commentBlock.classList.contains('open')) {
                commentBlock.classList.remove('open');
            } else {
                commentBlock.classList.add('open');
            }

            const slug = container.getAttribute('x-slug');
            console.log(slug);
            if (!commentBlock.classList.contains('init')) {
                commentBlock.classList.add('init');
                const metaEnvId = document.querySelector('meta[name="twikoo-env-id"]').getAttribute('content');
                twikoo.init({
                    envId: metaEnvId,
                    el: '#comments-' + slug, // 容器元素
                    path: '/chirp/' + slug,
                });
            }
        })
    })
})