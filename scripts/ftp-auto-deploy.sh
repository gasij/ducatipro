#!/usr/bin/env bash
# Watches the working tree for changes made directly on the server (e.g. via
# FTP), pushes them to git, pulls anything new from origin, and rebuilds/
# restarts the site if anything actually changed. Meant to run from cron on
# the production server — see the crontab line in the deploy notes.
set -euo pipefail

REPO_DIR="/var/www/ducatipro"
LOCK_FILE="/tmp/ducatipro-ftp-sync.lock"
LOG_FILE="/var/log/ducatipro-ftp-sync.log"

exec 200>"$LOCK_FILE"
flock -n 200 || exit 0

cd "$REPO_DIR"

log() {
  echo "$(date '+%F %T') $*" >>"$LOG_FILE"
}

CHANGED=0

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  if ! git diff --cached --quiet; then
    log "local changes detected, committing"
    GIT_AUTHOR_NAME="FTP Auto-Sync" GIT_AUTHOR_EMAIL="ftp-sync@ducatiparts.ru" \
      GIT_COMMITTER_NAME="FTP Auto-Sync" GIT_COMMITTER_EMAIL="ftp-sync@ducatiparts.ru" \
      git commit -m "Автозагрузка правок с сервера (FTP)" >>"$LOG_FILE" 2>&1

    if git push origin main >>"$LOG_FILE" 2>&1; then
      log "pushed local changes to origin/main"
      CHANGED=1
    elif git pull --rebase origin main >>"$LOG_FILE" 2>&1 && git push origin main >>"$LOG_FILE" 2>&1; then
      log "pushed local changes after rebase"
      CHANGED=1
    else
      log "ERROR: could not push local changes, needs manual resolution"
      exit 1
    fi
  else
    log "only ignored files changed, nothing to commit"
  fi
fi

git fetch origin main >>"$LOG_FILE" 2>&1
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  log "new commits on origin/main, pulling"
  git pull origin main >>"$LOG_FILE" 2>&1
  CHANGED=1
fi

if [ "$CHANGED" = "1" ]; then
  log "rebuilding site"
  npm install >>"$LOG_FILE" 2>&1
  npm run build >>"$LOG_FILE" 2>&1
  pm2 restart all >>"$LOG_FILE" 2>&1
  log "deploy finished"
else
  log "no changes, nothing to do"
fi
