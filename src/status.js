import { Actor } from 'apify';

import { containerUrl, keyValueStoreUrl } from './consts.js';
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

export async function updateStatus({ seriesTitle, writtenChapters, statusMessage, isFinished }) {
    status.message = statusMessage;
    let chaptersHtml = Object.keys(writtenChapters).sort((a,b) => b > a).map((key) => chapterHtml(writtenChapters[key])).join('\n');
    const statusPage = `<html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${seriesTitle}</title>
        <style>
            :root{--bg:#f6f7fb;--card:#ffffff;--accent:#6a5cff;--muted:#6b7280;--maxw:900px}
            html,body{height:100%}
            body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial;background:var(--bg);color:#111827;line-height:1.6;padding:24px;display:flex;justify-content:center}
            .container{width:100%;max-width:var(--maxw)}
            .status,.api-information,.download-link{background:var(--card);padding:12px 16px;border-radius:10px;box-shadow:0 1px 2px rgba(16,24,40,.05);margin-bottom:12px}
            .status p{margin:0;font-weight:600;color:var(--accent)}
            .api-information a{color:var(--accent);text-decoration:none;word-break:break-all}
            .download-link a{color:var(--accent);text-decoration:none;word-break:break-all}
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
        </style>
    </head>
    <body>
        <div class="container">
            <div class="status">
                <p>${statusMessage}</p>
            </div>
            ${isFinished 
            ? `
            <div class="download-link">
                <p>Download final chapters: <a href="${keyValueStoreUrl}?collection=final">${keyValueStoreUrl}?collection=final</a></p>
            </div>
            `
            : `
            <div class="api-information">
                <p>API is available at: <a href="${containerUrl}">${containerUrl}</a></p>
            </div>
            `}

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
        </script>
    </body>
</html>`;

    await Actor.setValue('status.html', statusPage, { contentType: 'text/html' });
}