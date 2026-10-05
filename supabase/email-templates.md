# Шаблоны писем Supabase на трёх языках

Письма отправляет Supabase, поэтому их тексты хранятся не в коде, а в панели Supabase:
**Authentication → Emails → Templates**. Язык письма берётся из аккаунта: при регистрации сайт
запоминает, на каком языке был открыт (`locale` в данных пользователя). У старых аккаунтов языка нет —
им письма приходят по-русски.

Для каждого шаблона ниже: вставьте строку «Тема» в поле **Subject**, а код — в поле **Body**
(режим Source), затем **Save**.

## Confirm signup — подтверждение email

Тема:

```
{{ if eq .Data.locale "kk" }}ShopTour: email-ді растаңыз{{ else if eq .Data.locale "en" }}ShopTour: confirm your email{{ else }}ShopTour: подтвердите email{{ end }}
```

Текст:

```html
{{ if eq .Data.locale "kk" }}
<h2>ShopTour-ға қош келдіңіз!</h2>
<p>Email-ді растап, аккаунтқа кіру үшін түймені басыңыз:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Email-ді растау</a></p>
<p>Егер сіз ShopTour-да тіркелмеген болсаңыз, бұл хатты елемеңіз.</p>
{{ else if eq .Data.locale "en" }}
<h2>Welcome to ShopTour!</h2>
<p>Tap the button to confirm your email and sign in:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm email</a></p>
<p>If you did not sign up for ShopTour, just ignore this letter.</p>
{{ else }}
<h2>Добро пожаловать в ShopTour!</h2>
<p>Нажмите кнопку, чтобы подтвердить email и войти в аккаунт:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Подтвердить email</a></p>
<p>Если вы не регистрировались на ShopTour, просто не отвечайте на это письмо.</p>
{{ end }}
```

## Reset password — восстановление пароля

Тема:

```
{{ if eq .Data.locale "kk" }}ShopTour: жаңа құпиясөз{{ else if eq .Data.locale "en" }}ShopTour: new password{{ else }}ShopTour: новый пароль{{ end }}
```

Текст:

```html
{{ if eq .Data.locale "kk" }}
<h2>Жаңа құпиясөз</h2>
<p>Жаңа құпиясөз орнату үшін түймені басыңыз. Сілтеме бір сағат жарамды.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Жаңа құпиясөз орнату</a></p>
<p>Егер құпиясөзді қалпына келтіруді сұрамаған болсаңыз, бұл хатты елемеңіз — құпиясөз өзгермейді.</p>
{{ else if eq .Data.locale "en" }}
<h2>New password</h2>
<p>Tap the button to set a new password. The link is valid for one hour.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Set a new password</a></p>
<p>If you did not ask to reset your password, ignore this letter — the password stays the same.</p>
{{ else }}
<h2>Новый пароль</h2>
<p>Нажмите кнопку, чтобы задать новый пароль. Ссылка действует один час.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Задать новый пароль</a></p>
<p>Если вы не просили восстановить пароль, не отвечайте на это письмо — пароль останется прежним.</p>
{{ end }}
```
