from selenium import webdriver
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from io import StringIO
import pandas as pd

BASE_URL_articles = "https://dpm.tn/controle-technique/amc/liste-des-articles"


def make_driver():
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--ignore-certificate-errors")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option("useAutomationExtension", False)
    return webdriver.Chrome(options=chrome_options)


def get_articles():
    driver = make_driver()
    wait = WebDriverWait(driver, 30)
    try:
        driver.get(BASE_URL_articles)
        driver.switch_to.frame(wait.until(EC.presence_of_element_located((By.TAG_NAME, "iframe"))))
        return driver.execute_script("""
            var select = document.querySelector('select[name="it_codite"]');
            return Array.from(select.options)
                .filter(o => o.value)
                .map(o => [o.value, o.text.trim()]);
        """)
    finally:
        driver.quit()


def get_all_articles_table(progress_callback=None):
    """
    Scrapes all articles into a single DataFrame.
    progress_callback(current, total, label) is called after each article,
    so callers (e.g. FastAPI background task) can report progress without
    this module depending on any UI framework.
    """
    driver = make_driver()
    wait = WebDriverWait(driver, 30)
    all_data = []

    try:
        articles = get_articles()
        total = len(articles)

        driver.get(BASE_URL_articles)
        driver.switch_to.frame(wait.until(EC.presence_of_element_located((By.TAG_NAME, "iframe"))))

        for i, (code, label) in enumerate(articles):
            try:
                Select(wait.until(EC.presence_of_element_located((By.NAME, "it_codite")))).select_by_value(code)
                wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@type='submit']"))).click()
                wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))

                if "Pas de produit" not in driver.page_source:
                    table = wait.until(EC.presence_of_element_located((By.TAG_NAME, "table")))
                    df = pd.read_html(StringIO(table.get_attribute("outerHTML")), header=0)[0]
                    df.columns = ["N", "Date", "Produit", "Importateur", "Fournisseur",
                                  "Provenance", "N° Lot", "Fabrication", "Expiration", "Extra"]
                    df["article_code"] = code
                    df["article_label"] = label
                    all_data.append(df)

                driver.back()
                driver.switch_to.frame(wait.until(EC.presence_of_element_located((By.TAG_NAME, "iframe"))))

            except Exception as e:
                print(f"Error for {label}: {e}")

            if progress_callback:
                progress_callback(i + 1, total, label)
            else:
                print(f"Chargement... {i+1}/{total} ({label})")

    finally:
        driver.quit()

    if all_data:
        return pd.concat(all_data, ignore_index=True)
    return None


# Allows running the scraper standalone too, e.g. via cron:
# python scrape.py
if __name__ == "__main__":
    import os
    result = get_all_articles_table()
    if result is not None:
        out_path = os.path.join(os.path.dirname(__file__), "..", "data", "ACM_data.csv")
        result.to_csv(out_path)
        print(f"Saved {len(result)} rows to {out_path}")
    else:
        print("No data scraped.")