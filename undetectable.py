from selenium.webdriver.common.by import By
import undetected_chromedriver as uc
from selenium import webdriver
import time

options = webdriver.ChromeOptions() 
options.add_argument("--remote-debugging-port=9222")
options.add_argument("--headless")
driver = uc.Chrome(options=options)
driver.get("https://www.google.com")
driver.find_element(By.XPATH, "//a[text()='Sign in']").click()
driver.find_element(By.CSS_SELECTOR, "input[type='email']").send_keys("mahmoudmousahamad\n")
print(driver.page_source)
time.sleep(5)
driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys("5337301Mh!\n")
time.sleep(5)
driver.print_page()
time.sleep(1000)