"""Publish a month's mobile app packs to the mobile-packs branch.

build_packs.py writes stats/<month>/_packs/ (gitignored on main); the app reads
them from the mobile-packs branch on raw.githubusercontent.com. This commits
that folder there and pushes it -- what was done by hand for 2026-08.

The branch holds every month's packs, a hundred megabytes each, so the work
happens in a temporary worktree that checks out only this month's folder.
The tournament and in-game workflows write the same branch, so a push that
loses a race rebases onto theirs and tries again.

Run by update_all_data.py after build_packs.py; on its own:

    python publish_packs.py                 # the latest month with packs
    python publish_packs.py --month 2026-08
    python publish_packs.py --dry-run       # commit in the worktree, do not push
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

REMOTE = "origin"
BRANCH = "mobile-packs"
PACK_DIR = "_packs"
MANIFEST = "_manifest.json"
PUSH_ATTEMPTS = 4


def git(*args, cwd=None, check=True, capture=False):
    return subprocess.run(
        ["git", *args], cwd=cwd, check=check, text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
    )


def latest_month(stats_dir="stats"):
    """The newest month with a built manifest, or None."""
    months = sorted(
        (m for m in os.listdir(stats_dir) if re.fullmatch(r"\d{4}-\d{2}", m)),
        reverse=True,
    )
    for month in months:
        if os.path.exists(os.path.join(stats_dir, month, PACK_DIR, MANIFEST)):
            return month
    return None


def publish(month, dry_run=False, stats_dir="stats"):
    """Commit stats/<month>/_packs to mobile-packs and push it. Returns True
    when the branch has it (pushed now, or already the same)."""
    src = os.path.join(stats_dir, month, PACK_DIR)
    manifest_path = os.path.join(src, MANIFEST)
    if not os.path.exists(manifest_path):
        print(f"publish_packs: no {manifest_path} -- run build_packs.py --month {month} first")
        return False
    with open(manifest_path, encoding="utf8") as fh:
        manifest = json.load(fh)
    count = manifest.get("pack_count", 0)
    megabytes = (manifest.get("total_bytes") or 0) / 1048576
    rel = f"stats/{month}/{PACK_DIR}"

    print(f"publish_packs: {month}, {count} packs, {megabytes:.0f} MB -> {BRANCH}")
    git("fetch", "-q", REMOTE, BRANCH)
    tmp = tempfile.mkdtemp(prefix="mobile-packs-")
    worktree = os.path.join(tmp, "packs")
    try:
        # Only this month's folder is checked out; the other months, a hundred
        # megabytes each, stay out of the working tree.
        git("worktree", "add", "-q", "--no-checkout", "--detach", worktree, f"{REMOTE}/{BRANCH}")
        git("sparse-checkout", "set", "--no-cone", f"/{rel}/", cwd=worktree)
        git("checkout", "-q", cwd=worktree)

        dest = os.path.join(worktree, *rel.split("/"))
        # Replace the folder wholesale, so a dataset no longer built goes too.
        shutil.rmtree(dest, ignore_errors=True)
        shutil.copytree(src, dest, ignore=shutil.ignore_patterns("*.tmp"))
        # Byte for byte: the app checks packs against the manifest's sizes.
        git("-c", "core.autocrlf=false", "add", "-A", "--sparse", rel, cwd=worktree)
        if git("diff", "--cached", "--quiet", cwd=worktree, check=False).returncode == 0:
            print("publish_packs: the branch already has these packs; nothing to push")
            return True
        git("-c", "user.name=MunchStats packs", "-c", "user.email=packs@munchstats.com",
            "commit", "-q", "-m", f"packs: {month} ({count} datasets, {megabytes:.0f} MB)", cwd=worktree)
        if dry_run:
            print("publish_packs: dry run -- committed in the worktree, not pushed")
            return False
        for attempt in range(PUSH_ATTEMPTS):
            if git("push", "-q", REMOTE, f"HEAD:{BRANCH}", cwd=worktree, check=False).returncode == 0:
                print(f"publish_packs: pushed {month} to {BRANCH}")
                return True
            # A workflow wrote the branch meanwhile: go on from theirs.
            print("publish_packs: the branch moved; rebasing and trying again")
            git("pull", "-q", "--rebase", REMOTE, BRANCH, cwd=worktree)
        print("publish_packs: could not push after %d attempts" % PUSH_ATTEMPTS)
        return False
    finally:
        git("worktree", "remove", "--force", worktree, check=False, capture=True)
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--month", default=None, help="default: the latest month with packs")
    ap.add_argument("--dry-run", action="store_true", help="commit in the worktree, do not push")
    args = ap.parse_args()
    month = args.month or latest_month()
    if not month:
        sys.exit("no built packs found under stats/*/_packs")
    ok = publish(month, dry_run=args.dry_run)
    sys.exit(0 if ok or args.dry_run else 1)


if __name__ == "__main__":
    main()
