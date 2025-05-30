// script.js
// Цей файл містить основну логіку вашого веб-додатка.

// Імпортуємо конфігурацію Firebase з окремого файлу.
// Цей файл (firebase-config.js) НЕ ПОВИНЕН БУТИ ЗАВАНТАЖЕНИЙ НА ГІТХАБ!
import { firebaseConfig } from './firebase-config.js';

// Імпортуємо необхідні функції з Firebase SDK v9+.
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// Логуємо початок виконання скрипта.
console.log("Script.js started.");

// Ініціалізуємо Firebase додаток з імпортованою конфігурацією.
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
console.log("Firebase initialized.");

// Змінна для поточної мови (завжди українська, як було обговорено).
let currentLanguage = 'uk';
// Об'єкти для зберігання завантаженого контенту та даних меню.
let allPagesContent = {};
let allMenuData = {};

// Чекаємо повного завантаження DOM перед виконанням скриптів.
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOMContentLoaded event fired.");

    // Отримуємо посилання на елементи DOM.
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    const pages = document.querySelectorAll('.page');
    const navMenuContainer = document.getElementById('nav-menu-container');

    // --- Функції для завантаження даних з Firebase та рендерингу ---

    /**
     * Завантажує основний текстовий контент сторінок (Новини, Про компанію, Контакти) з Firebase.
     * Після успішного завантаження запускає завантаження проєктів та меню,
     * а потім приховує екран завантаження.
     */
    onValue(ref(db, 'pages'), (snapshot) => {
        console.log("Attempting to get data from 'pages' node.");
        allPagesContent = snapshot.val() || {};
        console.log("Data for 'pages' received:", allPagesContent);

        // Якщо дані отримано, оновлюємо контент сторінок.
        renderPageContent();
        // Завантажуємо та рендеримо проєкти.
        loadProjects();
        // Завантажуємо та рендеримо навігаційне меню.
        loadNavMenu();

        // Приховуємо екран завантаження після затримки.
        setTimeout(() => {
            console.log("Hiding loading screen and showing main content.");
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                mainContent.style.display = 'flex'; // Показуємо основний контент
            }, 500); // Час анімації зникнення екрану завантаження
        }, 1500); // Затримка перед початком зникнення (для видимості анімації завантаження)

    }, (error) => {
        // Обробка помилок при завантаженні основного контенту.
        console.error("Помилка завантаження основного контенту з Firebase: ", error);
        // Навіть якщо є помилка, спробуємо відобразити те, що є, і приховати екран завантаження.
        renderPageContent();
        loadProjects();
        loadNavMenu();
        setTimeout(() => {
            console.log("Hiding loading screen even with an error.");
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                mainContent.style.display = 'flex';
            }, 500);
        }, 1500);
    });

    /**
     * Рендерить текстовий контент для сторінок "Новини", "Про компанію", "Контакти".
     */
    function renderPageContent() {
        console.log("Rendering page content...");

        // --- НОВА ГОЛОВНА СТОРІНКА (НОВИНИ) ---
        const homePageData = allPagesContent.home;
        if (homePageData) {
            document.getElementById('home-title').innerText = homePageData[`title_${currentLanguage}`];
            const newsListDiv = document.getElementById('news-list');
            newsListDiv.innerHTML = ''; // Очищаємо список новин

            onValue(ref(db, 'news_articles'), (snapshot) => {
                const newsArticles = snapshot.val() || {};
                console.log("News articles data:", newsArticles);
                if (newsArticles) {
                    // Перетворюємо об'єкт новин на масив і сортуємо за датою (від найновіших).
                    const sortedNews = Object.keys(newsArticles).map(key => ({
                        id: key,
                        ...newsArticles[key]
                    })).sort((a, b) => new Date(b.date) - new Date(a.date));

                    sortedNews.forEach(news => {
                        const newsCard = document.createElement('div');
                        newsCard.className = 'section news-card';
                        newsCard.innerHTML = `
                            <h3>${news[`title_${currentLanguage}`]}</h3>
                            <p class="news-date">${news.date}</p>
                            <div>${news[`content_${currentLanguage}`]}</div>
                        `;
                        newsListDiv.appendChild(newsCard);
                    });
                } else {
                    newsListDiv.innerHTML = `<p>Наразі новин немає.</p>`;
                }
            }, (error) => {
                console.error("Помилка завантаження новин: ", error);
                newsListDiv.innerHTML = `<p>Не вдалося завантажити новини.</p>`;
            });
        }

        // --- СТОРІНКА ПРО КОМПАНІЮ (колишні "Послуги") ---
        const aboutPageData = allPagesContent.about;
        if (aboutPageData) {
            document.getElementById('about-title').innerText = aboutPageData[`title_${currentLanguage}`];
            document.getElementById('about-intro').innerText = aboutPageData[`intro_${currentLanguage}`] || '';
            const aboutContentDiv = document.getElementById('about-content');
            aboutContentDiv.innerHTML = `
                <p>${aboutPageData[`content_${currentLanguage}_p1`] || ''}</p>
                <p>${aboutPageData[`content_${currentLanguage}_p2`] || ''}</p>
            `;
        }

        // --- СТОРІНКА КОНТАКТІВ ---
        const contactPageData = allPagesContent.contact;
        if (contactPageData) {
            document.getElementById('contact-title').innerText = contactPageData[`title_${currentLanguage}`];
            document.getElementById('contact-intro').innerText = contactPageData[`intro_${currentLanguage}`];
            document.getElementById('contact-email').innerHTML = `📧 Email: <a href="mailto:${contactPageData.email_ua}">${contactPageData.email_ua}</a>`;
            document.getElementById('contact-telegram').innerHTML = `💬 Telegram: <a href="https://t.me/${contactPageData.telegram_ua.substring(1)}" target="_blank">${contactPageData.telegram_ua}</a>`;
        }

        // Оновлюємо заголовок сторінки в браузері.
        updatePageTitle();
    }

    /**
     * Завантажує та рендерить список проєктів з Firebase.
     */
    function loadProjects() {
        console.log("Loading projects...");
        onValue(ref(db, 'projects'), (snapshot) => {
            const projectsListDiv = document.getElementById('projects-list');
            projectsListDiv.innerHTML = ''; // Очищаємо попередній список
            const projects = snapshot.val();
            console.log("Projects data:", projects);

            if (projects) {
                Object.keys(projects).forEach(key => {
                    const project = projects[key];
                    const projectCard = document.createElement('div');
                    projectCard.className = 'project-card';
                    projectCard.innerHTML = `
                        <h3>${project[`title_${currentLanguage}`]}</h3>
                        ${project.id === 'weeclick' ? `
                            <div class="weeclick-logo-wrapper">
                                <span class="weeclick-logo-text">WeeClick</span>
                            </div>
                        ` : ''}
                        <p>${project[`description_${currentLanguage}`]}</p>
                        ${project.link ? `<p><a href="${project.link}" target="_blank">Детальніше</a></p>` : ''}
                    `;
                    projectsListDiv.appendChild(projectCard);
                });
            } else {
                projectsListDiv.innerHTML = `<p>Наразі проєктів немає.</p>`;
            }
        }, (error) => {
            console.error("Помилка завантаження проєктів: ", error);
            document.getElementById('projects-list').innerHTML = `<p>Не вдалося завантажити проєкти.</p>`;
        });
    }

    /**
     * Завантажує та рендерить навігаційне меню у футері.
     */
    function loadNavMenu() {
        console.log("Loading navigation menu...");
        onValue(ref(db, 'menu_items'), (snapshot) => {
            allMenuData = snapshot.val() || {};
            navMenuContainer.innerHTML = ''; // Очищаємо перед додаванням
            console.log("Menu data:", allMenuData);

            // Визначений порядок кнопок для меню.
            const menuOrder = ['home-page', 'about-page', 'projects-page', 'contact-page'];
            menuOrder.forEach(pageId => {
                const item = allMenuData[pageId];
                if (item) { // Перевіряємо наявність елемента в Firebase.
                    const button = document.createElement('button');
                    button.className = 'nav-button';
                    button.setAttribute('data-page', pageId);
                    button.setAttribute('onclick', `showPage('${pageId}')`); // Прив'язуємо функцію showPage
                    button.innerHTML = `<span>${item.icon}</span> <span>${item[`text_${currentLanguage}`]}</span>`;
                    navMenuContainer.appendChild(button);
                }
            });
            // Показуємо домашню сторінку за замовчуванням після завантаження меню.
            if (navMenuContainer.children.length > 0) {
                showPage('home-page');
            }
        }, (error) => {
            console.error("Помилка завантаження меню: ", error);
            navMenuContainer.innerHTML = `<p style="color:white; font-size:0.8em;">Помилка завантаження меню.</p>`;
        });
    }

    /**
     * Функція для перемикання видимості сторінок та оновлення активної кнопки меню.
     * Доступна глобально через `window.showPage`.
     * @param {string} pageId - ID сторінки, яку потрібно показати (наприклад, 'home-page').
     */
    window.showPage = function(pageId) {
        console.log(`Showing page: ${pageId}`);
        pages.forEach(page => {
            page.style.display = 'none'; // Приховуємо всі сторінки.
        });
        document.getElementById(pageId).style.display = 'block'; // Показуємо обрану сторінку.

        // Оновлюємо активну кнопку меню.
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(button => {
            button.classList.remove('active');
        });
        const activeButton = document.querySelector(`.nav-button[data-page="${pageId}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        updatePageTitle(); // Оновлюємо заголовок сторінки в браузері.
    };

    /**
     * Оновлює заголовок сторінки в вкладці браузера відповідно до активної сторінки.
     */
    function updatePageTitle() {
        const activePageId = document.querySelector('.page[style*="display: block"]')?.id;
        let pageTitle = 'Weebwe LLC'; // Заголовок за замовчуванням.

        // Отримуємо назву сторінки з даних Firebase.
        if (activePageId && allPagesContent[activePageId.replace('-page', '')]) {
            pageTitle = allPagesContent[activePageId.replace('-page', '')][`title_${currentLanguage}`] || pageTitle;
        } else if (activePageId === 'home-page' && allPagesContent.home) {
            pageTitle = allPagesContent.home[`title_${currentLanguage}`] || pageTitle;
        }
        document.title = pageTitle;
        console.log("Document title updated to:", document.title);
    }
}); // Кінець DOMContentLoaded
