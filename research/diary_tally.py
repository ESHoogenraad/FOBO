"""Tally the B1 diary study and apply its three Checkpoint A decision rules.

Usage: python3 research/diary_tally.py research/data

Expects two CSV files in the given folder (formats in "B1 Diary kit.md"):
  diary-log.csv   participant,date,device,channel,site,trigger,next_action
  diary-days.csv  participant,date,tempted
"""

import csv
import statistics
import sys
from collections import Counter, defaultdict
from pathlib import Path

# The handoff's default trigger list. gathering.tweakers.net is deliberately absent:
# a tweakers.net/* permission does not cover it.
DEFAULT_SITES = {"tweakers.net", "gsmarena.com", "coolblue.nl", "bol.com", "mediamarkt.nl"}
WEB_CHANNELS = {"browser", "video", "social", "forum"}
MOBILE_DEVICES = {"phone", "tablet"}


def read(path):
    with open(path, newline="", encoding="utf-8") as f:
        return [{k: (v or "").strip().lower() for k, v in row.items()} for row in csv.DictReader(f)]


def normalise_site(site):
    site = site.removeprefix("https://").removeprefix("http://").removeprefix("www.")
    return site.split("/")[0]


def main(folder):
    folder = Path(folder)
    log = read(folder / "diary-log.csv")
    days = read(folder / "diary-days.csv")

    # A day counts as observed if the evening check was answered or something was logged.
    observed = defaultdict(set)
    for row in days:
        observed[row["participant"]].add(row["date"])
    for row in log:
        observed[row["participant"]].add(row["date"])

    per_person = Counter(row["participant"] for row in log)
    desktop = Counter(
        row["participant"] for row in log
        if row["device"] == "computer" and row["channel"] in WEB_CHANNELS
    )

    print("Temptations per person (observed days, per week, desktop-browser per two weeks)")
    desktop_rates = []
    for p in sorted(observed):
        n_days = len(observed[p])
        per_week = per_person[p] / n_days * 7
        desktop_per_2w = desktop[p] / n_days * 14
        desktop_rates.append(desktop_per_2w)
        print(f"  {p}: {n_days} days, {per_person[p]} logged, {per_week:.1f}/week, desktop {desktop_per_2w:.1f}/2 weeks")

    total = len(log)
    if total == 0:
        print("No log entries yet.")
        return

    print("\nShare by place")
    for (device, channel), n in Counter((r["device"], r["channel"]) for r in log).most_common():
        print(f"  {device:9} {channel:14} {n:3}  {n / total:.0%}")

    sites = defaultdict(set)
    for row in log:
        if row["site"]:
            sites[normalise_site(row["site"])].add(row["participant"])
    print("\nSites and apps named (number of people)")
    for site, people in sorted(sites.items(), key=lambda kv: -len(kv[1])):
        flag = "" if site in DEFAULT_SITES else "  not on default list"
        print(f"  {site:28} {len(people)}{flag}")

    print("\nDecision rules (Checkpoint A)")
    median_desktop = statistics.median(desktop_rates)
    print(f"  1. Median desktop-browser temptations per person per two weeks: {median_desktop:.1f}"
          + ("  -> below 1: the bar alone cannot carry Stage 1" if median_desktop < 1 else ""))

    mobile = sum(1 for r in log if r["device"] in MOBILE_DEVICES or r["channel"] == "shop_app")
    print(f"  2. Share on the phone or in apps: {mobile / total:.0%}"
          + ("  -> above 60%: bring Stage 2 forward" if mobile / total > 0.6 else ""))

    new_sites = [s for s, people in sites.items() if s not in DEFAULT_SITES and len(people) >= 3]
    print("  3. Not on the default list, named by 3 or more people: "
          + (", ".join(sorted(new_sites)) + "  -> add the websites among them" if new_sites else "none"))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
