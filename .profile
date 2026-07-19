# Sourced by Heroku at dyno boot, before the web process starts.
# Cap glibc malloc arenas: with 8 gunicorn threads the default (8 x cores)
# fragments freed 30 MB Smogon parses across arenas that never shrink,
# ratcheting RSS toward the 512 MB quota. A config var of the same name
# takes precedence if set.
export MALLOC_ARENA_MAX=${MALLOC_ARENA_MAX:-2}
