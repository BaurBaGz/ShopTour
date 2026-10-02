#!/bin/zsh
# Резервная копия базы ShopTour на этот компьютер: ~/ShopTourBackups/<дата>/
# Запускается автоматически раз в день (launchd, см. scripts/README-backup.md); можно и вручную.
# В копии — личные данные покупателей и магазинов: папку не выкладывать и не отправлять.
set -euo pipefail

PROJECT_DIR="${0:A:h:h}"
BACKUP_DIR="$HOME/ShopTourBackups"
KEEP=30 # сколько последних копий хранить
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"

DB="$(grep '^DATABASE_URL=' "$PROJECT_DIR/.env.local" | tr -d '[:space:]' | cut -d= -f2-)"
[[ -n "$DB" ]] || { echo "DATABASE_URL не найден в .env.local"; exit 1; }

TODAY="$(date +%Y-%m-%d)"
TARGET="$BACKUP_DIR/$TODAY"
umask 077
mkdir -p "$BACKUP_DIR"

# Сегодняшняя копия уже есть — второй раз не делаем (запуск и по расписанию, и при входе в систему)
if [[ -f "$TARGET/public.sql.gz" && "${1:-}" != "--force" ]]; then
  echo "$(date '+%F %T') копия за $TODAY уже есть"
  exit 0
fi

TMP="$BACKUP_DIR/.tmp-$TODAY"
rm -rf "$TMP"
mkdir -p "$TMP"

# 1) Все таблицы сайта: структура, правила доступа и данные
pg_dump "$DB" --schema=public --no-owner | gzip > "$TMP/public.sql.gz"
# 2) Аккаунты (покупатели, владельцы магазинов, сотрудники) — только данные
pg_dump "$DB" --data-only --table=auth.users --table=auth.identities | gzip > "$TMP/auth-users.sql.gz"
# 3) Список загруженных фото (сами файлы лежат в хранилище Supabase)
pg_dump "$DB" --data-only --table=storage.buckets --table=storage.objects | gzip > "$TMP/storage-list.sql.gz"

# Пустой или оборванный файл — это не копия
for f in public auth-users storage-list; do
  gzip -t "$TMP/$f.sql.gz"
done
gunzip -c "$TMP/public.sql.gz" | grep -q "PostgreSQL database dump complete" || { echo "копия public неполная"; exit 1; }

rm -rf "$TARGET"
mv "$TMP" "$TARGET"

# Оставляем только последние $KEEP копий
all=("$BACKUP_DIR"/20??-??-??(N/on))
if (( ${#all} > KEEP )); then
  for old in "${all[@]:0:$(( ${#all} - KEEP ))}"; do rm -rf "$old"; done
fi

echo "$(date '+%F %T') копия готова: $TARGET ($(du -sh "$TARGET" | cut -f1))"
