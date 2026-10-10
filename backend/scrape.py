import time

import pandas as pd
import requests
import urllib3
from lxml import html

# dpm.tn serves an incomplete certificate chain, so verification is disabled.
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

FORM_URL = "https://dpm.tn/dpm_pharm/aspamc/listproduit.php"
RESULT_URL = "https://dpm.tn/dpm_pharm/aspamc/listamcproduit.php"

COLUMNS = ["N", "Date", "Produit", "Importateur", "Fournisseur",
           "Provenance", "N° Lot", "Fabrication", "Expiration", "Extra"]


def _make_session():
    session = requests.Session()
    session.verify = False
    session.headers["User-Agent"] = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
    return session


def _post_with_retry(session, code, attempts=3):
    for attempt in range(attempts):
        try:
            response = session.post(RESULT_URL, data={"it_codite": code}, timeout=30)
            response.raise_for_status()
            return response
        except requests.RequestException:
            if attempt == attempts - 1:
                raise
            time.sleep(2 * (attempt + 1))


def get_articles(session=None):
    session = session or _make_session()
    response = session.get(FORM_URL, timeout=30)
    response.raise_for_status()
    tree = html.fromstring(response.content)
    return [
        (o.get("value"), (o.text or "").strip())
        for o in tree.xpath('//select[@name="it_codite"]/option')
        if o.get("value")
    ]


def _parse_rows(page):
    tree = html.fromstring(page)
    rows = []
    for tr in tree.xpath("//tr"):
        cells = [td.text_content().replace("\xa0", " ").strip() for td in tr.xpath("./td")]
        if len(cells) == len(COLUMNS) and cells[0] != "N":
            rows.append(cells)
    return rows


def get_all_articles_table(progress_callback=None):
    """
    Scrapes all articles into a single DataFrame.
    progress_callback(current, total, label) is called after each article,
    so callers (e.g. FastAPI background task) can report progress without
    this module depending on any UI framework.
    """
    session = _make_session()
    articles = get_articles(session)
    total = len(articles)
    all_data = []

    for i, (code, label) in enumerate(articles):
        try:
            rows = _parse_rows(_post_with_retry(session, code).content)
            if rows:
                df = pd.DataFrame(rows, columns=COLUMNS)
                df["article_code"] = code
                df["article_label"] = label
                all_data.append(df)
        except Exception as e:
            print(f"Error for {label}: {e}")

        if progress_callback:
            progress_callback(i + 1, total, label)
        else:
            print(f"Chargement... {i+1}/{total} ({label})")

    if all_data:
        return pd.concat(all_data, ignore_index=True)
    return None


# Allows running the scraper standalone, e.g. via GitHub Actions:
# python backend/scrape.py
if __name__ == "__main__":
    import sys
    from pathlib import Path

    result = get_all_articles_table()
    if result is None or result.empty:
        print("No data scraped.")
        sys.exit(1)

    out_path = Path(__file__).parent.parent / "frontend" / "public" / "ACM_data.csv"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(out_path, index=False)
    print(f"Saved {len(result)} rows to {out_path}")