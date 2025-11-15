import browser_cookie3

def get_cookies():
    try:
        cj = browser_cookie3.load()
        with open('cookies.txt', 'w') as f:
            for cookie in cj:
                f.write(f'{cookie.domain}\t{str(cookie.secure).upper()}\t{cookie.path}\t{str(cookie.secure).upper()}\t{cookie.expires}\t{cookie.name}\t{cookie.value}\n')
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    get_cookies()
