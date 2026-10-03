#!/usr/bin/env bash
# Remote-only publishing: replace /steam in a new release, verify, then switch.
set -euo pipefail
work=${1:?upload directory required}
name=${2:?release name required}
expected=${3:?expected current release required}
case "$work" in /tmp/aidazi-steam-effects-[0-9TZ]*) ;; *) exit 2;; esac
case "$name" in aidazi-steam-effects-[0-9TZ]*) ;; *) exit 2;; esac
case "$expected" in /srv/aidazi/releases/*) ;; *) exit 2;; esac
previous=$(readlink -f /srv/aidazi/current)
test "$previous" = "$expected"
systemctl is-active --quiet aidazi-web
release="/srv/aidazi/releases/$name"
test ! -e "$release"
python3 - "$work/steam-overlay.tar.gz" <<'PY'
import sys,tarfile
from pathlib import PurePosixPath
with tarfile.open(sys.argv[1]) as archive:
 for member in archive.getmembers():
  parts=PurePosixPath(member.name).parts
  assert parts and parts[0]=='steam' and '..' not in parts and not member.name.startswith('/'),member.name
  assert member.isfile() or member.isdir(),member.name
PY
mkdir -m 755 "$release"
cp -a "$previous/." "$release/"
# Only delete the copied child app inside this new, guarded release directory.
rm -rf "$release/steam"
tar --no-same-owner -xzf "$work/steam-overlay.tar.gz" -C "$release"
(cd "$release" && sha256sum --check "$work/OVERLAY_SHA256SUMS")
cmp "$previous/index.html" "$release/index.html"
test -s "$release/steam/index.html"
test -s "$release/steam/audio/manifest.json"
activated=0
rollback(){
 if [ "$activated" = 1 ] && [ "$(readlink -f /srv/aidazi/current)" = "$release" ]; then
  ln -s "$previous" "/srv/aidazi/.rollback-$name"
  mv -Tf "/srv/aidazi/.rollback-$name" /srv/aidazi/current
 fi
}
trap rollback ERR
# Do not overwrite a concurrent publication.
test "$(readlink -f /srv/aidazi/current)" = "$previous"
ln -s "$release" "/srv/aidazi/.next-$name"
mv -Tf "/srv/aidazi/.next-$name" /srv/aidazi/current
activated=1
for file in steam/index.html steam/release.json steam/audio/manifest.json; do
 url="https://aidazi.tech/$file"
 if [ "$file" = steam/index.html ]; then url='https://aidazi.tech/steam/'; fi
 readback="$work/readback"
 curl --fail --silent --show-error --max-time 20 --resolve aidazi.tech:443:127.0.0.1 "$url" -o "$readback"
 cmp "$release/$file" "$readback"
done
cmp "$previous/index.html" /srv/aidazi/current/index.html
systemctl is-active --quiet aidazi-web
test "$(readlink -f /srv/aidazi/current)" = "$release"
trap - ERR
printf 'previous=%s\ncurrent=%s\n' "$previous" "$release"
sha256sum "$release/index.html" "$release/steam/index.html" "$release/steam/release.json"
