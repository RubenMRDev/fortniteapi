import './style.css';

const API_URL = 'https://fortnite-api.com/v2/shop';
const NEW_ITEMS_URL = 'https://fortnite-api.com/v2/cosmetics/new';
const ALL_ITEMS_URL = 'https://fortnite-api.com/v2/cosmetics';
const STATS_URL = 'https://fortnite-api.com/v2/stats/br/v2';
const API_KEY = import.meta.env.VITE_API_KEY;

const container = document.getElementById('shop-container');
const newItemsContainer = document.getElementById('new-items-container');
const allItemsContainer = document.getElementById('all-items-container');
const statsContainer = document.getElementById('stats-container');
const statsResult = document.getElementById('stats-result');
const allItemsGrid = document.getElementById('all-items-grid');
const loading = document.getElementById('loading');
const timerElement = document.getElementById('reset-timer');
const tabs = document.querySelectorAll('.tab-btn');

// Filters
const searchInput = document.getElementById('files-search');
const typeFilter = document.getElementById('files-type');
const sortFilter = document.getElementById('files-sort');
const loadMoreBtn = document.getElementById('load-more-btn');

// Stats Logic
const statsInput = document.getElementById('stats-username');
const statsBtn = document.getElementById('stats-btn');

let allCosmeticsCache = []; // Almacena TODOS los items descargados
let filteredCosmetics = []; // Almacena los items tras aplicar filtros
let currentPage = 1;
const ITEMS_PER_PAGE = 50;

// Manejo de tabs
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        if (!tab.dataset.target) return;

        // Activar botón
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Mostrar sección correspondiente
        const target = tab.dataset.target;
        container.style.display = 'none';
        newItemsContainer.style.display = 'none';
        allItemsContainer.style.display = 'none';
        statsContainer.style.display = 'none';

        if (target === 'shop') {
            container.style.display = 'block';
        } else if (target === 'new') {
            newItemsContainer.style.display = 'block';
            if (newItemsContainer.children.length === 0) fetchNewItems();
        } else if (target === 'all') {
            allItemsContainer.style.display = 'block';
            if (allCosmeticsCache.length === 0) fetchAllItems();
        } else if (target === 'stats') {
             statsContainer.style.display = 'block';
             setTimeout(() => {
                 const input = document.getElementById('stats-username');
                 if(input) input.focus();
             }, 100);
        }
    });
});

// Event Listeners para filtros
searchInput.addEventListener('input', applyFilters);
typeFilter.addEventListener('change', applyFilters);
sortFilter.addEventListener('change', applyFilters);
loadMoreBtn.addEventListener('click', () => {
    renderPagedItems();
});

statsBtn.addEventListener('click', () => {
    const user = statsInput.value.trim();
    if(user) {
        fetchStats(user);
    } else {
        statsResult.innerHTML = '<h3 style="text-align:center; color:#ff5555;">Please enter a username.</h3>';
        statsInput.focus();
    }
});

statsInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const user = statsInput.value.trim();
        if(user) {
            fetchStats(user);
        } else {
            statsResult.innerHTML = '<h3 style="text-align:center; color:#ff5555;">Please enter a username.</h3>';
        }
    }
});


// Función principal
async function fetchShop() {
    try {
        loading.style.display = 'block';
        loading.textContent = "Loading shop...";
        const response = await fetch(API_URL);
        const json = await response.json();
        
        if (json.status !== 200) throw new Error("Error fetching shop");
        
        const data = json.data;
        
        // Configurar la fecha de la tienda
        setupTimer(data.date); // La API devuelve la fecha de la tienda actual

        // Procesar items
        renderShop(data.entries);
        loading.style.display = 'none';

    } catch (error) {
        console.error(error);
        loading.textContent = "Error loading shop. Try again later.";
    }
}

async function fetchNewItems() {
    try {
        loading.style.display = 'block';
        loading.textContent = "Loading new cosmetics...";
        const response = await fetch(NEW_ITEMS_URL);
        const json = await response.json();

        if (json.status !== 200) throw new Error("Error fetching new items");

        renderNewItems(json.data.items);
        loading.style.display = 'none';

    } catch (error) {
        console.error("Error new items:", error);
        newItemsContainer.innerHTML = "<h2 style='text-align:center'>Could not load new items.</h2>";
        loading.style.display = 'none';
    }
}

function renderNewItems(items) {
    const sections = [
        { key: 'br', title: 'Battle Royale' },
        { key: 'tracks', title: 'Jam Tracks' },
        { key: 'instruments', title: 'Instruments' },
        { key: 'cars', title: 'Cars' },
        { key: 'lego', title: 'LEGO' },
        { key: 'legoKits', title: 'LEGO Kits' },
        { key: 'beans', title: 'Beans' }
    ];

    sections.forEach(section => {
        if (items[section.key] && items[section.key].length > 0) {
            
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'mb-12'; // Tailwind replacement for shop-section
            
            const titleEl = document.createElement('h2');
            titleEl.className = 'font-luckiest text-4xl !mt-8 !mb-10 uppercase drop-shadow-[2px_2px_0_#000] border-b-4 border-accent inline-block pr-5'; // Tailwind replacement for section-title
            titleEl.textContent = section.title;
            
            const gridEl = document.createElement('div');
            gridEl.className = 'grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4'; // Tailwind replacement for items-grid

            items[section.key].forEach(item => {
                // Adaptar el item para ser compatible con createItemCard
                // createItemCard espera un "entry" de tienda, simularemos uno
                let simulatedEntry = {};
                
                // Emular estructura según tipo
                if (section.key === 'br') simulatedEntry = { brItems: [item] };
                else if (section.key === 'tracks') simulatedEntry = { tracks: [item] };
                else if (section.key === 'instruments') simulatedEntry = { instruments: [item] };
                else if (section.key === 'cars') simulatedEntry = { cars: [item] };
                else if (section.key === 'lego') simulatedEntry = { lego: [item] }; // Necesitaremos tweakear createItemCard
                else if (section.key === 'legoKits') simulatedEntry = { legoKits: [item] };
                else if (section.key === 'beans') simulatedEntry = { beans: [item] };
                
                // Estos items no tienen precio de tienda por defecto en este endpoint
                simulatedEntry.isNewItem = true; 

                const card = createItemCard(simulatedEntry);
                gridEl.appendChild(card);
            });

            sectionDiv.appendChild(titleEl);
            sectionDiv.appendChild(gridEl);
            newItemsContainer.appendChild(sectionDiv);
        }
    });
    
    if (newItemsContainer.children.length === 0) {
        newItemsContainer.innerHTML = "<h2>No new items reported.</h2>";
    }
}

// --- LOGICA STATS ---

async function fetchStats(username) {
    try {
        statsResult.innerHTML = '<div style="text-align:center; font-size: 1.5rem;">Loading stats...</div>';
        
        // Url with params
        const url = `${STATS_URL}?name=${username}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': API_KEY
            }
        });
        
        const json = await response.json();
        
        if (json.status !== 200) {
             throw new Error(json.error || "Error fetching stats");
        }
        
        renderStats(json.data);

    } catch (error) {
        console.error("Stats Error:", error);
        statsResult.innerHTML = `
            <div style="text-align:center; color: #ff5555;">
                <h2>Error searching for player</h2>
                <p>Make sure the name is correct and the account is public.</p>
            </div>
        `;
    }
}

function renderStats(data) {
    const account = data.account;
    const battlePass = data.battlePass;
    const stats = data.stats.all; // Usamos stats generales (all inputs)

    if (!stats) {
        statsResult.innerHTML = "<h2>No stats available for this player.</h2>";
        return;
    }

    // Helper para filas de stats
    const createRow = (label, value) => `
        <div class="flex justify-between items-center border-b border-white/5 py-3 last:border-0 hover:bg-white/5 px-3 rounded-md transition-colors duration-200">
            <span class="text-gray-400 uppercase text-sm font-bold tracking-wider">${label}</span>
            <span class="font-bold text-xl text-white drop-shadow-md font-oswald">${value}</span>
        </div>
    `;

    // Helper card
    const createCard = (title, dataObj, typeClass='') => {
        if (!dataObj) return '';
        return `
            <div class="bg-[#18181b] p-8 rounded-2xl border border-white/10 shadow-2xl min-w-[320px] flex-1 transform transition-all duration-300 hover:scale-[1.02] hover:border-accent hover:shadow-[0_0_20px_rgba(252,238,10,0.1)] ${typeClass}">
                <div class="font-luckiest text-3xl mb-6 text-accent uppercase tracking-widest text-center border-b-2 border-white/5 pb-4 drop-shadow-[2px_2px_0_#000]">${title}</div>
                <div class="flex flex-col gap-1">
                    ${createRow('Wins', dataObj.wins)}
                    ${createRow('Win Rate', dataObj.winRate.toFixed(2) + '%')}
                    ${createRow('Kills', dataObj.kills)}
                    ${createRow('K/D', dataObj.kd.toFixed(2))}
                    ${createRow('Matches', dataObj.matches)}
                    ${createRow('Top 10/12/3', (dataObj.top10 || dataObj.top12 || dataObj.top3 || 0))} 
                </div>
            </div>
        `;
    };

    const overallHtml = createCard('GENERAL (LIFETIME)', stats.overall, 'overall');
    const soloHtml = createCard('SOLO', stats.solo);
    const duoHtml = createCard('DUO', stats.duo);
    const squadHtml = createCard('SQUAD', stats.squad);
    // const ltmHtml = createCard('LTM', stats.ltm);

    statsResult.innerHTML = `
        <div class="flex flex-col gap-8">
            <div class="text-center bg-white/5 p-8 rounded-xl border border-white/10 backdrop-blur-sm">
                <div class="font-luckiest text-5xl uppercase text-white mb-2 drop-shadow-md">${account.name}</div>
                <div class="text-lg text-[#aaa]">Battle Pass Level: ${battlePass.level} (Progress: ${battlePass.progress}%)</div>
            </div>
            
            <div class="flex flex-wrap gap-5 justify-center mt-5">
                ${overallHtml}
                ${soloHtml}
                ${duoHtml}
                ${squadHtml}
            </div>
        </div>
    `;
}

// --- LOGICA ALL ITEMS ---

async function fetchAllItems() {
    try {
        loading.style.display = 'block';
        loading.textContent = "Downloading cosmetics database... (This may take a few seconds)";
        
        const response = await fetch(ALL_ITEMS_URL);
        const json = await response.json();

        if (json.status !== 200) throw new Error("Error fetching all items");

        // Aplanar la respuesta, ya que viene separada por categorías en 'data' 
        // keys: br, tracks, instruments, cars, lego, legoKits, beans
        const data = json.data;
        
        allCosmeticsCache = [
            ...(data.br || []).map(i => ({...i, _category: 'br'})),
            ...(data.tracks || []).map(i => ({...i, _category: 'tracks'})),
            ...(data.instruments || []).map(i => ({...i, _category: 'instruments'})),
            ...(data.cars || []).map(i => ({...i, _category: 'cars'})),
            ...(data.lego || []).map(i => ({...i, _category: 'lego'})),
            ...(data.legoKits || []).map(i => ({...i, _category: 'legoKits'})),
            ...(data.beans || []).map(i => ({...i, _category: 'beans'}))
        ];

        applyFilters();
        loading.style.display = 'none';
        
    } catch (error) {
        console.error("Error all items:", error);
        loading.textContent = "Error loading cosmetics.";
    }
}

function applyFilters() {
    const search = searchInput.value.toLowerCase();
    const type = typeFilter.value;
    const sort = sortFilter.value;

    filteredCosmetics = allCosmeticsCache.filter(item => {
        // Filtrar por nombre
        let name = item.name || item.title || ""; // tracks usan title
        if (!name.toLowerCase().includes(search)) return false;

        // Filtrar por tipo
        if (type !== 'all') {
            // Mapeo simple de tipos
            if (type === 'outfit' && item.type?.value !== 'outfit') return false;
            if (type === 'emote' && item.type?.value !== 'emote') return false;
            if (type === 'pickaxe' && item.type?.value !== 'pickaxe') return false;
            if (type === 'glider' && item.type?.value !== 'glider') return false;
            if (type === 'backpack' && item.type?.value !== 'backpack') return false;
            if (type === 'track' && item._category !== 'tracks') return false;
            if (type === 'car' && item._category !== 'cars') return false;
            if (type === 'instrument' && item._category !== 'instruments') return false;
            if (type === 'lego' && item._category !== 'lego' && item._category !== 'legoKits') return false;
        }

        return true;
    });

    // Ordenar
    filteredCosmetics.sort((a, b) => {
        if (sort === 'name-asc') {
            const nameA = a.name || a.title || "";
            const nameB = b.name || b.title || "";
            return nameA.localeCompare(nameB);
        } else if (sort === 'date-desc') {
            return new Date(b.added) - new Date(a.added);
        } else if (sort === 'date-asc') {
            return new Date(a.added) - new Date(b.added);
        }
    });

    // Reiniciar paginación y renderizar
    currentPage = 1;
    allItemsGrid.innerHTML = '';
    renderPagedItems();
}

function renderPagedItems() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const itemsToShow = filteredCosmetics.slice(start, end);

    itemsToShow.forEach(item => {
        // Adaptar para createItemCard
        let simulatedEntry = {};
        if (item._category === 'br') simulatedEntry = { brItems: [item] };
        else if (item._category === 'tracks') simulatedEntry = { tracks: [item] };
        else if (item._category === 'instruments') simulatedEntry = { instruments: [item] };
        else if (item._category === 'cars') simulatedEntry = { cars: [item] };
        else if (item._category === 'lego') simulatedEntry = { lego: [item] };
        else if (item._category === 'legoKits') simulatedEntry = { legoKits: [item] };
        else if (item._category === 'beans') simulatedEntry = { beans: [item] };

        // Estos items son de archivo, no tienda diaria
        simulatedEntry.isNewItem = false; 
        simulatedEntry.finalPrice = null; // No mostrar pavo si no son de tienda
        simulatedEntry.regularPrice = null;

        // Custom render tweak to show rarity background correctly even if simulated
        const card = createItemCard(simulatedEntry);
        
        allItemsGrid.appendChild(card);
    });

    if (end >= filteredCosmetics.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'inline-block';
    }

    if (filteredCosmetics.length === 0) {
        allItemsGrid.innerHTML = "<h3 style='grid-column: 1/-1; text-align:center;'>No results found.</h3>";
    }

    currentPage++;
}


function renderShop(entries) {
    // 1. Agrupar items por sección (layout.name)
    const sections = {};

    entries.forEach(entry => {
        // A veces no tienen layout, usar "Otros"
        const sectionName = entry.layout?.name || "Featured"; 
        const sectionRank = entry.layout?.rank || 999; // Para ordenar

        if (!sections[sectionName]) {
            sections[sectionName] = {
                rank: sectionRank,
                items: []
            };
        }
        sections[sectionName].items.push(entry);
    });

    // 2. Convertir a array y ordenar por rango
    const sortedSections = Object.entries(sections)
        .sort(([, a], [, b]) => a.rank - b.rank);

    // 3. Crear HTML
    sortedSections.forEach(([title, data]) => {
        // Crear contenedor de sección
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'mb-12'; // Tailwind replacement for shop-section
        
        const titleEl = document.createElement('h2');
        titleEl.className = 'font-luckiest text-4xl !mt-8 !mb-8 uppercase drop-shadow-[2px_2px_0_#000] border-b-4 border-accent inline-block pr-5'; // Tailwind replacement for section-title
        titleEl.textContent = title;
        
        const gridEl = document.createElement('div');
        gridEl.className = 'grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4'; // Tailwind replacement for items-grid

        // Crear tarjetas para cada item
        data.items.forEach(item => {
            const card = createItemCard(item);
            gridEl.appendChild(card);
        });

        sectionDiv.appendChild(titleEl);
        sectionDiv.appendChild(gridEl);
        container.appendChild(sectionDiv);
    });
}

function createItemCard(entry) {
    const card = document.createElement('div');
    // Tailwind replacement for card
    card.className = 'relative aspect-[1/1.2] rounded-lg overflow-hidden cursor-pointer transition-transform duration-200 border border-white/10 flex flex-col hover:scale-105 hover:shadow-xl hover:border-accent hover:z-10 bg-card-bg group';

    // -- Lógica para determinar el nombre y la imagen --
    // La API es compleja. Puede ser un Bundle, un item normal, una canción (tracks), un coche, etc.
    
    let name = "";
    let imageUrl = "";
    let rarityClass = "rarity-common"; // Default
    let itemsArray = [];

    // Prioridad de datos
    if (entry.bundle) {
        name = entry.bundle.name;
        imageUrl = entry.bundle.image;
    } else if (entry.brItems && entry.brItems.length > 0) {
        itemsArray = entry.brItems;
        name = itemsArray[0].name;
        // La API de nuevos items tiene estructura de imágenes similar
        imageUrl = itemsArray[0].images.featured || itemsArray[0].images.icon || itemsArray[0].images.smallIcon;
        if(itemsArray[0].rarity) rarityClass = `rarity-${itemsArray[0].rarity.value.toLowerCase()}`;
    } else if (entry.tracks && entry.tracks.length > 0) {
        name = entry.tracks[0].title;
        imageUrl = entry.tracks[0].albumArt;
        rarityClass = 'rarity-icon'; 
    } else if (entry.cars && entry.cars.length > 0) {
        name = entry.cars[0].name;
        // Coches pueden tener images.large o images.small
        imageUrl = entry.cars[0].images.large || entry.cars[0].images.small; 
        if(entry.cars[0].rarity) rarityClass = `rarity-${entry.cars[0].rarity.value.toLowerCase()}`;
    } else if (entry.instruments && entry.instruments.length > 0) {
        name = entry.instruments[0].name;
        imageUrl = entry.instruments[0].images.large || entry.instruments[0].images.small;
        if(entry.instruments[0].rarity) rarityClass = `rarity-${entry.instruments[0].rarity.value.toLowerCase()}`;
    } else if (entry.lego && entry.lego.length > 0) { // Soporte LEGO
        // Lego items id logic
        // El endpoint new items devuelve objetos lego con 'images.large'
        name = "LEGO Item"; // A veces no traen nombre directo en root, verificar cosmeticId si es necesario
        // Pero en 'new items', lego array objects tienen cosmeticId. 
        // Si no tienen 'name', usamos fallback.
        if(entry.lego[0].images) imageUrl = entry.lego[0].images.large || entry.lego[0].images.small;
    } else if (entry.legoKits && entry.legoKits.length > 0) {
        name = entry.legoKits[0].name;
        imageUrl = entry.legoKits[0].images.large || entry.legoKits[0].images.small;
        rarityClass = 'rarity-common'; // Ojo rarity
    } else if (entry.beans && entry.beans.length > 0) {
        name = entry.beans[0].name;
        imageUrl = entry.beans[0].images.large || entry.beans[0].images.small;
        rarityClass = 'rarity-common';
    }

    // SI HAY newDisplayAsset, este tiene prioridad visual (son los renders 3D de la tienda)
    if (entry.newDisplayAsset && entry.newDisplayAsset.renderImages && entry.newDisplayAsset.renderImages.length > 0) {
        imageUrl = entry.newDisplayAsset.renderImages[0].image;
    }

    // -- Colores de fondo --
    // La API devuelve colores hexadecimales para el fondo de la tarjeta. Usémoslos si existen.
    if (entry.colors && entry.colors.color1 && entry.colors.color3) {
        // Fortnite usa gradientes radiales o lineales con estos colores
        card.style.background = `radial-gradient(circle, #${entry.colors.color1.slice(0,6)} 0%, #${entry.colors.color3.slice(0,6)} 100%)`;
    } else {
        card.classList.add(rarityClass);
    }

    // -- HTML Interno de la tarjeta --
    const vbuckIcon = "https://fortnite-api.com/images/vbuck.png";
    
    // Verificar descuento
    let priceHtml = '';
    
    if (entry.isNewItem) {
        priceHtml = '<span class="text-gray-400 text-xs">NEW</span>';
    } else if (entry.finalPrice != null) { // Solo si tiene precio
        if (entry.finalPrice < entry.regularPrice) {
            priceHtml = `
                <span class="line-through text-gray-500 mr-2">${entry.regularPrice}</span>
                <img src="${vbuckIcon}" alt="V" class="w-[18px] mr-1"> ${entry.finalPrice}
            `;
        } else {
            priceHtml = `<img src="${vbuckIcon}" alt="V" class="w-[18px] mr-1"> ${entry.finalPrice}`;
        }
    } else {
         priceHtml = '<span class="text-gray-400">--</span>';
    }

    // Banner (ej. "New!", "Reactive")
    let bannerHtml = '';
    if (entry.banner) {
        bannerHtml = `<div class="card-banner">${entry.banner.value}</div>`;
    } else if (entry.isNewItem) {
         bannerHtml = `<div class="card-banner" style="background:#fcee0a; color:black;">NEW</div>`;
    }

    card.innerHTML = `
        ${bannerHtml}
        <div class="w-full flex-1 bg-cover bg-center relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-1/2 after:bg-gradient-to-t after:from-black/80 after:to-transparent" style="background-image: url('${imageUrl}');"></div>
        <div class="h-auto min-h-[80px] px-4 py-2 flex flex-col justify-center bg-[#151515] z-[2] border-t-2 border-white/10 relative">
            <div class="text-base font-bold uppercase whitespace-normal leading-tight mb-1 text-white shadow-black drop-shadow-md !pl-2">${name}</div>
            <div class="flex items-center mt-1 text-sm text-[#e6e6e6] !pl-2">${priceHtml}</div>
        </div>
    `;

    return card;
}

// Configurar el timer (Cuenta atrás hasta el próximo día UTC 00:00 o la fecha de la API)
function setupTimer(shopDate) {
    // La tienda suele rotar a las 00:00 UTC
    const updateCountdown = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setUTCHours(24, 0, 0, 0); // Próxima rotación 00:00 UTC
        
        const diff = tomorrow - now;
        
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        timerElement.textContent = `Refreshes in: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    setInterval(updateCountdown, 1000);
    updateCountdown();
}

// Iniciar
fetchShop();