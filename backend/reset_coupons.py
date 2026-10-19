"""One-off script: wipe all coupons/coupon_usages and load the new coupon list.

Backs up `coupons` and `coupon_usages` to backups/ first, and asks for
confirmation unless run with --yes.
"""
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from postgrest.exceptions import APIError

from app.config import supabase

QUARTER = "Fall 2026"
EXPIRATION = "2026-12-13"
BACKUP_DIR = Path(__file__).parent / "backups"
PAGE_SIZE = 1000
# PostgREST / Postgres codes for "that table does not exist"
MISSING_TABLE_CODES = {"PGRST205", "42P01"}

COUPONS = [
    ("Moge Tea", "Student Discount 10% off", 0),
    ("Moge Tea", "First Time Discount 15% off", 0),
    ("Moge Tea", "Group Discount (over 15 drinks), 15% off", 0),
    ("La Cocinita", "15% off", 0),
    ("Animal Records", "$5 off and free dog pets", 1),
    ("Papa Johns Pizza", "Large 1 topping pizza $6.99 each. (Coupon Code : SOCHEAPP) — Valid online only, Sign in Required. Delivery or Carryout", 0),
    ("Lock Chicago", "20% off any of our escape room experiences when booking online at Lockedchicago.com using the code: WILLIE20", 0),
    ("Curt's Café", "20% off", 0),
    ("Eva Nails", "$15 off first visit", 1),
    ("Eva Nails", "Discounted Nail Design", 0),
    ("YoFresh", "Free Jr. Smoothie or Giant Chocolate Chip Cookie with any purchase", 0),
    ("YoFresh", "Free chips and drink with any sandwich", 0),
    ("YoFresh", "10% Wildcat discount on all regular purchases", 0),
    ("Ovo Frito Cafe", "15% off — Present at checkout (recommended for in-store purchases)", 0),
    ("Pilates Connection Chicago", "50% off your first private lesson or small group class.", 1),
    ("Pilates Connection Chicago", "15% discount on lessons, classes, and packages after your first visit.", 0),
    ("Crave Cookies", "10% off", 0),
    ("Devil Dawgs Evanston", "10% off of all Food and Beverage (excluding Alcohol). Please use instore only and present proof of participation to the cashier. Excluding Happy Hour menu items 2-5pm Monday-Friday.", 0),
    ("Mt. Everest Restaurant", "15% off", 0),
    ("Frida's Evanston", "15% FIRST-TIME VISIT PROMOTION — NO RESTRICTIONS", 1),
    ("Gather: Consciously Curated", "First-time visitors to Gather: Consciously Curated get 15% off regular-priced items.", 1),
    ("Gather: Consciously Curated", "Regularly show your college ID throughout the year for 10% all regular-priced items!", 0),
    ("Reprise Coffee Roasters", "10% off coffee, tea, matcha beverages and coffee bags", 0),
    ("Club Pilates Evanston", "Waived enrollment fee and 10% off your 8 pack and unlimited membership, just show Wildcard", 0),
    ("Crossroads Trading", "10% off one regular price item — Not available on consignment", 0),
]


def fetch_all(table):
    rows = []
    while True:
        page = supabase.table(table).select("*").range(len(rows), len(rows) + PAGE_SIZE - 1).execute().data
        rows.extend(page)
        if len(page) < PAGE_SIZE:
            return rows


def backup():
    BACKUP_DIR.mkdir(exist_ok=True)
    path = BACKUP_DIR / f"coupons-{datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}.json"
    data = {table: fetch_all(table) for table in ("coupons", "coupon_usages")}
    path.write_text(json.dumps(data, indent=2, default=str))
    print(f"Backed up {len(data['coupons'])} coupons and {len(data['coupon_usages'])} usages to {path}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--yes", action="store_true", help="skip the confirmation prompt")
    args = parser.parse_args()

    if not args.yes:
        answer = input("This deletes ALL coupons, coupon usages and saved coupons. Type 'reset' to continue: ")
        if answer.strip() != "reset":
            print("Aborted.")
            sys.exit(1)

    backup()

    supabase.table("coupon_usages").delete().neq("id", 0).execute()
    supabase.table("coupons").delete().neq("coupon_id", 0).execute()
    # saved_coupons has no foreign key to coupons (a view), so clear the
    # hearts that now point at deleted ids
    try:
        supabase.table("saved_coupons").delete().neq("coupon_id", -1).execute()
    except APIError as e:
        if e.code not in MISSING_TABLE_CODES:
            raise

    rows = [
        {
            "vendor": vendor,
            "offer": offer,
            "usage_limit": usage_limit,
            "quarter": QUARTER,
            "expiration_date": EXPIRATION,
        }
        for vendor, offer, usage_limit in COUPONS
    ]
    result = supabase.table("coupons").insert(rows).execute()
    print(f"Inserted {len(result.data)} coupons")

if __name__ == "__main__":
    main()
