/**
 * Bangumi Anime Collection App (Optimized)
 * Fetches real-time data from the Bangumi (Bgm.tv) API v0
 */

// --- Configuration ---
// Note: Some browsers may require a CORS proxy or a local server to fetch from bgm.tv directly
const BANGUMI_USERNAME = '1202652'; 
const API_BASE = 'https://api.bgm.tv/v0';

const STATUS_CONFIG = {
    wish: {
        id: 'wish',
        label: '我想看',
        icon: 'heart',
        color: 'text-pink-500',
        bg: 'bg-pink-50',
        border: 'border-pink-200'
    },
    watching: {
        id: 'watching',
        label: '我在看',
        icon: 'play',
        color: 'text-brand-500',
        bg: 'bg-brand-50',
        border: 'border-brand-200'
    },
    completed: {
        id: 'completed',
        label: '我看过',
        icon: 'check-circle',
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        border: 'border-blue-200'
    },
    on_hold: {
        id: 'on_hold',
        label: '我搁置',
        icon: 'pause-circle',
        color: 'text-amber-500',
        bg: 'bg-amber-50',
        border: 'border-amber-200'
    },
    dropped: {
        id: 'dropped',
        label: '我抛弃',
        icon: 'x-circle',
        color: 'text-gray-500',
        bg: 'bg-gray-50',
        border: 'border-gray-200'
    }
};

// --- Core Application Logic ---

class AnimeApp {
    constructor() {
        this.container = document.getElementById('app-container');
        this.skeleton = document.getElementById('loading-skeleton');
        // Initialize all categories to prevent "undefined" errors
        this.data = { wish: [], watching: [], completed: [], on_hold: [], dropped: [] };
    }

    /**
     * Fetch real data from Bangumi API v0
     */
    /**
     * Optimized Fetch: Gets all collection types to ensure "Wish" isn't buried
     */
    async fetchData() {
        // We define the types we want to fetch: 1=Wish, 2=Collect, 3=Do, 4=On Hold, 5=Dropped
        const types = [1, 3, 2, 4, 5];
        const processed = { wish: [], watching: [], completed: [], on_hold: [], dropped: [] };
        
        try {
            // Fetch multiple types in parallel for better performance and completeness
            const fetchPromises = types.map(type => 
                fetch(`${API_BASE}/users/${BANGUMI_USERNAME}/collections?subject_type=2&type=${type}&limit=30`, {
                    headers: {
                        'User-Agent': 'GeminiAnimeApp/1.1',
                        'Accept': 'application/json'
                    }
                }).then(res => res.json())
            );

            const results = await Promise.all(fetchPromises);

            results.forEach((result, index) => {
                const type = types[index];
                if (result.data) {
                    result.data.forEach(item => {
                        const subject = item.subject;
                        subject.ep_status = item.ep_status || 0;

                        switch (type) {
                            case 1: processed.wish.push(subject); break;
                            case 3: processed.watching.push(subject); break;
                            case 2: processed.completed.push(subject); break;
                            case 4: processed.on_hold.push(subject); break;
                            case 5: processed.dropped.push(subject); break;
                        }
                    });
                }
            });

            this.data = processed;
        } catch (error) {
            console.error('Bangumi API Error:', error);
            this.showErrorMessage(error.message);
        }
    }

    showErrorMessage(msg) {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="col-span-full p-10 text-center">
                <div class="inline-flex flex-col items-center text-red-500 font-medium">
                    <i data-lucide="alert-circle" class="w-10 h-10 mb-4 opacity-50"></i>
                    <p>无法加载数据: ${msg}</p>
                    <button onclick="location.reload()" class="mt-4 text-xs bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 transition-colors">点击重试</button>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    }

    createCardHTML(subject, statusConfig) {
        const displayName = subject.name_cn || subject.name;
        const originalName = subject.name_cn ? subject.name : '';
        const imageUrl = subject.images?.large || subject.images?.common || '';
        
        return `
            <div class="group relative flex flex-col rounded-lg bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md focus-within:ring-2 focus-within:ring-brand-400" role="article" tabindex="0">
                <div class="aspect-[2/3] w-full overflow-hidden rounded-t-lg bg-gray-200 relative">
                    <div class="absolute inset-0 animate-pulse bg-gray-300 skeleton-loader"></div>
                    <div class="error-fallback absolute inset-0 hidden flex-col items-center justify-center bg-gray-100 text-gray-400 p-2 text-center">
                        <i data-lucide="image-off" class="w-6 h-6 mb-1"></i>
                        <span class="text-xs">暂无封面</span>
                    </div>
                    <img 
                        src="${imageUrl}" 
                        alt="${displayName}"
                        class="h-full w-full object-cover transition-opacity duration-300 opacity-0 group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onload="this.classList.remove('opacity-0'); this.previousElementSibling.previousElementSibling.style.display='none';"
                        onerror="this.style.display='none'; this.previousElementSibling.classList.remove('hidden'); this.previousElementSibling.classList.add('flex'); this.previousElementSibling.previousElementSibling.style.display='none';"
                    />
                    <div class="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                        ${subject.ep_status} / ${subject.eps || '??'} 话
                    </div>
                </div>
                <div class="flex flex-1 flex-col p-3">
                    <h3 class="line-clamp-2 text-sm font-bold text-gray-900 leading-tight mb-1" title="${displayName}">
                        ${displayName}
                    </h3>
                    ${originalName ? `<p class="mb-2 line-clamp-1 text-xs text-gray-500 italic" title="${originalName}">${originalName}</p>` : ''}
                    <div class="mt-auto inline-flex items-center text-xs font-medium ${statusConfig.color}">
                        <i data-lucide="${statusConfig.icon}" class="w-3 h-3 mr-1"></i>
                        ${statusConfig.label}
                    </div>
                </div>
        `;
    }

    createSectionHTML(key, items) {
        const config = STATUS_CONFIG[key];
        if (!items || items.length === 0) return ''; 

        const cardsHTML = items.map(item => this.createCardHTML(item, config)).join('');

        return `
            <section class="mb-10 animate-fade-in section-container" data-status="${key}">
                <div class="group flex cursor-pointer items-center justify-between border-b border-gray-200 pb-3 mb-4 select-none section-header" role="button" aria-expanded="true">
                    <div class="flex items-center">
                        <h2 class="text-xl font-bold flex items-center ${config.color}">
                            ${config.label}
                        </h2>
                        <span class="ml-3 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                            ${items.length}
                        </span>
                    </div>
                    <button class="rounded-full p-1 text-gray-400 hover:bg-gray-100 transition-colors focus:outline-none toggle-btn">
                        <i data-lucide="chevron-up" class="w-5 h-5 transition-all duration-200"></i>
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 section-content">
                    ${cardsHTML}
                </div>
            </section>
        `;
    }

    bindEvents() {
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', () => {
                const section = header.parentElement;
                const content = section.querySelector('.section-content');
                const icon = section.querySelector('.toggle-btn i');
                const isHidden = content.style.display === 'none';
                
                content.style.display = isHidden ? 'grid' : 'none';
                // Using transform for smoother animation than replacing the icon
                icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
                header.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
            });
        });
    }

    async render() {
        await this.fetchData();

        if (this.skeleton) this.skeleton.classList.add('hidden');
        if (this.container) this.container.classList.remove('hidden');

        // Render Order: Wish -> Watching -> Completed -> On Hold -> Dropped
        const sectionsOrder = ['wish', 'watching', 'completed', 'on_hold', 'dropped'];
        let htmlContent = '';

        sectionsOrder.forEach(key => {
            htmlContent += this.createSectionHTML(key, this.data[key]);
        });

        if (this.container) {
            this.container.innerHTML = htmlContent || `
                <div class="p-20 text-center text-gray-400">
                    <i data-lucide="search-x" class="w-12 h-12 mx-auto mb-4 opacity-20"></i>
                    <p>该用户的动画收藏列表为空</p>
                </div>
            `;
        }

        // Re-trigger Lucide icons for the new HTML
        if (window.lucide) window.lucide.createIcons();
        this.bindEvents();
    }
}

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    const app = new AnimeApp();
    app.render();
});