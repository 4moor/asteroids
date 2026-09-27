# Первоначальная подготовка репозитория

Цель — играбельный Asteroids-lite для учебных PR и экспериментов
с проектными инструкциями, skills и готовыми MCP.

## Этапы

1. Начальная инфраструктура: MIT, npm-команды, публичный registry, CI и CODEOWNERS.
2. Защита main: обязательные PR и CI; персональное исключение KalininVD
   только из требования ревью.
3. [PR 1](https://github.com/asteroids-developers/asteroids/pull/1):
   детерминированная симуляция и модульные тесты.
4. [PR 2](https://github.com/asteroids-developers/asteroids/pull/2):
   браузерная игра и Playwright.
5. [PR 3](https://github.com/asteroids-developers/asteroids/pull/3):
   независимые миссии и автоматический каталог.
6. Снимок control перед добавлением агентского слоя.
7. Агентские инструкции, два skills, permissions и руководство контрибьютора.
8. Итоговая проверка CI, правил GitHub, чистоты main и тег workshop-start.

Каждый функциональный этап проходит через PR и сливается после зелёного CI.
Ветки сохраняются для разбора истории на занятии.
Стек: JavaScript, Canvas, Node.js 24, Vite 8.3.0, Playwright 1.63.0.
