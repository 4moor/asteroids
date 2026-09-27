# Защита main

Настройки репозитория используют два активных ruleset.

| Правило | Требования | Исключения |
|---|---|---|
| [main-integrity](https://github.com/asteroids-developers/asteroids/rules/24071336) | PR, успешный `ci` от GitHub Actions, актуальная база, разрешённые обсуждения; запрет удаления и force push | Нет |
| [main-review](https://github.com/asteroids-developers/asteroids/rules/24071338) | Одно одобрение, ревью владельца кода, сброс устаревшего одобрения | Только KalininVD, только при слиянии PR |

Владелец всех файлов задан в `.github/CODEOWNERS`: `* @KalininVD`.
Студенческие PR требуют его актуального одобрения. Собственные PR
KalininVD можно сливать после успешного CI, используя персональное
исключение только из правила ревью.

GitHub выдаёт право обхода пользователю, выполняющему слияние, а не автору PR.
Поэтому технически KalininVD может обойти ревью и чужого PR. Правила
этого проекта разрешают применять исключение только к его собственным PR.
Обойти `main-integrity` это исключение не позволяет.

Используется squash merge. Ветки первоначальной разработки сохраняются
как примеры. CI запускается на GitHub-hosted runner через `pull_request`
и `push` в main; workflow имеет только права чтения и не использует секреты.

Настройки можно прочитать командой:

```sh
gh api repos/asteroids-developers/asteroids/rulesets
```

Документация GitHub:
[правила](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets),
[CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).
