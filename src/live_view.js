import { containerUrl, writtenChapters } from './consts.js';
import { convertToHtml } from './html.js';

export const status = {
    message: '',
};

function chapterHtml(chapter) {
      return `
        <section>
            <header>
                <h2>${chapter.chapterName}</h2>
            </header>
            <div class="content">
                <main>
                    <blockquote>
                        ${convertToHtml(chapter.introduction)}

                        <p>${chapter.attribution}</p>
                    </blockquote>
                    <hr>
                    ${convertToHtml(chapter.body)}
                    <br />
                    <img src="${chapter.illustrationUrl}" alt="chapter illustration" />
                </main>
                <footer>
                    <p>Authors note:</p>
                    ${convertToHtml(chapter.note)}
                </footer>
            </div>
        </section>
    `;
}

export async function getStatus({ seriesTitle, statusMessage }) {
    let chaptersHtml = Object.keys(writtenChapters).sort((a,b) => b > a).map((key) => chapterHtml(writtenChapters[key])).join('\n');
    return `<html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${seriesTitle}</title>
        <style>
            :root{--bg:#f6f7fb;--card:#ffffff;--accent:#6a5cff;--muted:#6b7280;--maxw:900px}
            html,body{height:100%}
            body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial;background:var(--bg);color:#111827;line-height:1.6;padding:24px;display:flex;justify-content:center}
            .container{width:100%;max-width:var(--maxw)}
            .status,.api-information{background:var(--card);padding:12px 16px;border-radius:10px;box-shadow:0 1px 2px rgba(16,24,40,.05);margin-bottom:12px}
            .status p{margin:0;font-weight:600;color:var(--accent)}
            .api-information a{color:var(--accent);text-decoration:none;word-break:break-all}
            section{background:var(--card);border-radius:12px;padding:0;margin:14px 0;box-shadow:0 6px 18px rgba(15,23,42,0.06);overflow:hidden;border:1px solid rgba(15,23,42,0.04)}
            section header{padding:16px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;background:linear-gradient(90deg, rgba(106,92,255,0.06), rgba(106,92,255,0.02));border-bottom:1px solid rgba(15,23,42,0.03)}
            section header::before{content:"";width:6px;height:36px;background:var(--accent);border-radius:4px;margin-right:12px;display:inline-block;flex-shrink:0;box-shadow:0 2px 6px rgba(106,92,255,0.08)}
            section header h2{margin:0;font-size:1.125rem;font-weight:600;letter-spacing:0.2px}
            section .content{padding:0 20px 18px 20px;transition:max-height .32s ease,opacity .2s ease;overflow:hidden}
            section footer{background:transparent;padding:12px 20px;border-top:1px solid rgba(15,23,42,0.03);color:var(--muted)}
            section img{display:block;max-width:100%;height:auto;border-radius:8px;margin-top:12px}
            .chev{width:20px;height:20px;display:inline-block;transform:rotate(90deg);transition:transform .2s ease;flex-shrink:0}
            section.collapsed header .chev{transform:rotate(-90deg)}
            @media (max-width:640px){body{padding:14px} section header h2{font-size:1rem}}
            /* subtle content formatting inside chapters */
            blockquote{border-left:3px solid rgba(99,102,241,.12);padding-left:12px;color:var(--muted);margin:12px 0}
            code{background:#f3f4f6;padding:2px 6px;border-radius:6px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace}
            /* auto-refresh warning/info box */
            .top-row{display:flex;gap:12px;align-items:stretch}
            /* allow the status to grow and take remaining space, keep the warning a bounded box */
            .top-row .status{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;justify-content:center;padding:12px 14px}
            /* Status heading + message styling */
            .status h3{margin:0;color:var(--muted);font-size:0.85rem;font-weight:600;text-transform:uppercase;letter-spacing:0.6px}
            .status p{margin:0;margin-top:6px;font-size:1.05rem;font-weight:700;color:var(--accent)}
            .auto-refresh-warning{display:flex;align-items:center;gap:12px;background:linear-gradient(90deg, rgba(96,165,250,0.08), rgba(96,165,250,0.03));border:1px solid rgba(96,165,250,0.18);color:#0f172a;padding:12px 14px;border-radius:10px;margin-bottom:12px;position:relative;max-height:220px;transition:opacity .28s ease,max-height .32s ease,transform .18s ease;flex:0 0 auto;max-width:400px}
            .auto-refresh-warning p{margin:0;padding:0;flex:1;color:#0f172a}
            .auto-refresh-warning img.auto-refresh{height:100px;width:auto;object-fit:contain;opacity:.95;border:2px solid #374151;border-radius:6px}
            /* Float the close button partly outside the warning so it doesn't obscure the image */
            .auto-refresh-warning .auto-refresh-close{position:absolute;top:-10px;right:-10px;background:#ffffff;border:1px solid rgba(15,23,42,0.06);color:var(--muted);font-size:18px;line-height:1;padding:8px;cursor:pointer;border-radius:10px;box-shadow:0 8px 22px rgba(15,23,42,0.10);z-index:8;display:inline-flex;align-items:center;justify-content:center;min-width:40px;min-height:40px}
            .auto-refresh-warning .auto-refresh-close:hover{background:#f3f4f6}
            @media (max-width:520px){
                .auto-refresh-warning .auto-refresh-close{top:6px;right:6px;transform:translate(0,0);}
            }
            .auto-refresh-warning.closing{opacity:0;max-height:0;padding-top:0;padding-bottom:0;margin:0;overflow:hidden}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="top-row">
                <div class="status">
                    <h3>Current status:</h3>
                    <p>${statusMessage}</p>
                </div>
                <div class="auto-refresh-warning" role="region" aria-label="Auto refresh warning">
                    <p>Disable auto-refresh to stop the page from refreshing every 3 seconds.</p>
                    <div>
                        <img class="auto-refresh" src="data:image/png;base64,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" alt="auto-refresh" />
                    </div>
                    <button class="auto-refresh-close" aria-label="Close auto refresh warning">×</button>
                </div>
            </div>
            <div class="api-information">
                <p>API is available at: <a href="${containerUrl}">${containerUrl}</a></p>
            </div>

            ${chaptersHtml}
        </div>
        
        <script>
            (function(){
                // Select top-level sections inside the container
                const sections = Array.from(document.querySelectorAll('.container > section'));
                sections.forEach((sec, idx) => {
                    const header = sec.querySelector('header');
                    // content contains both main and footer so authors note collapses with the section
                    const content = sec.querySelector('.content');
                    const main = sec.querySelector('main');
                    if(!header || !main) return;

                    // Create chevron indicator
                    const chev = document.createElement('span');
                    chev.className = 'chev';
                    chev.setAttribute('aria-hidden','true');
                    chev.textContent = '▾';
                    header.appendChild(chev);

                    // Accessibility attributes
                    const mainId = 'chapter-main-' + idx;
                    // associate header with the collapsible content (not only <main>)
                    content.id = mainId;
                    header.setAttribute('role','button');
                    header.setAttribute('tabindex','0');
                    header.setAttribute('aria-controls', mainId);
                    // Start collapsed by default
                    header.setAttribute('aria-expanded','false');
                    sec.classList.add('collapsed');

                    // Initialize collapsed state
                    content.style.maxHeight = '0px';
                    content.style.opacity = '0';
                    content.style.display = 'block';

                    function collapse(shouldClose){
                        const isOpen = header.getAttribute('aria-expanded') === 'true';
                        const willOpen = (typeof shouldClose === 'boolean') ? !shouldClose : !isOpen;
                        if(willOpen){
                            // open
                            sec.classList.remove('collapsed');
                            header.setAttribute('aria-expanded','true');
                            const sh = content.scrollHeight;
                            content.style.display = '';
                            requestAnimationFrame(()=>{
                                content.style.maxHeight = sh + 'px';
                                content.style.opacity = '1';
                            });
                        } else {
                            // close
                            header.setAttribute('aria-expanded','false');
                            sec.classList.add('collapsed');
                            const curH = content.scrollHeight;
                            content.style.maxHeight = curH + 'px';
                            requestAnimationFrame(()=>{
                                content.style.maxHeight = '0px';
                                content.style.opacity = '0';
                            });
                        }
                    }

                    header.addEventListener('click', ()=> collapse());
                    header.addEventListener('keydown', (e)=>{
                        if(e.key === 'Enter' || e.key === ' '){
                            e.preventDefault();
                            collapse();
                        }
                    });
                });
            })();
            // Auto-refresh warning close handler
            (function(){
                const warn = document.querySelector('.auto-refresh-warning');
                if(!warn) return;
                const btn = warn.querySelector('.auto-refresh-close');
                if(!btn) return;
                btn.addEventListener('click', ()=>{
                    // animate closing
                    warn.classList.add('closing');
                    // remove after transition
                    setTimeout(()=>{
                        if(warn && warn.parentNode) warn.parentNode.removeChild(warn);
                    }, 350);
                });
            })();
        </script>
    </body>
</html>`;
}