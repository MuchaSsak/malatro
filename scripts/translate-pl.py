"""Fill src/locales/pl/messages.po from the dictionary below (English source ids -> Polish).

Run after `lingui extract`: python scripts/translate-pl.py && bunx lingui compile --typescript --strict
Missing ids are printed so the strict compile never surprises us.
"""

import re
from pathlib import Path

PO = Path(__file__).resolve().parent.parent / "src" / "locales" / "pl" / "messages.po"

PL = {
    "Figure from the original sheet": "Rysunek z oryginalnego arkusza",
    "No answer": "Brak odpowiedzi",
    "Required to play this card. A wrong answer scores 0 chips.": "Wymagana, by zagrać kartę. Błędna odpowiedź daje 0 Żetonów.",
    "Task {0}. (0-{1})": "Zadanie {0}. (0-{1})",
    "Your answer": "Twoja odpowiedź",
    "Your answer was right ✓": "Twoja odpowiedź była poprawna ✓",
    "Your answer was wrong ✗": "Twoja odpowiedź była błędna ✗",
    "Audio": "Dźwięk",
    "Background at 30 fps and lower resolution, no blur": "Tło w 30 fps i niższej rozdzielczości, bez rozmycia",
    "Blockier background at 20 fps, no shine animations, no idle sway": "Grubsze piksele tła w 20 fps, bez animacji połysku i kołysania kart",
    "Everything on, background capped at 60 fps": "Wszystko włączone, tło do 60 fps",
    "Fullscreen (F)": "Pełny ekran (F)",
    "Game": "Gra",
    "Graphics": "Grafika",
    "High": "Wysoka",
    "Low": "Niska",
    "Medium": "Średnia",
    "Pixel cursor": "Pikselowy kursor",
    "Video": "Obraz",
    "{0} leveled up to lvl.{1}": "{0}: poziom w górę do lvl.{1}",
    "{0} tasks in this deck": "{0} zadań w tej talii",
    "A correct note earns $1 when the card is played. Try √, ^, /, π.": "Poprawna notatka daje $1 przy zagraniu karty. Działa √, ^, /, π.",
    "A matura roguelike deckbuilder": "Maturalny roguelike karciany",
    "Abandon run": "Porzuć grę",
    "Abandon this run? Progress will be lost.": "Porzucić tę grę? Postęp przepadnie.",
    "Account created - welcome!": "Konto założone - witaj!",
    "Answer from the key": "Odpowiedź z klucza",
    "Ante": "Ante",
    "Ante {0}": "Ante {0}",
    "Ante {0} · ${1} · {2} Jokers": "Ante {0} · ${1} · Jokery: {2}",
    "Ante {0} Boss": "Boss ante {0}",
    "ANTE {0} VOUCHER": "BON ANTE {0}",
    "Back": "Wróć",
    "Back to the table": "Wróć do stołu",
    "Basic": "Podstawa",
    "Beat the Boss to raise the Ante": "Pokonaj Bossa, by podnieść ante",
    "Best hand": "Najlepsza ręka",
    "Big Blind": "Duża ciemna",
    "Boss: no scratch paper!": "Boss: zakaz brudnopisu!",
    "Branch": "Dział",
    "Buy": "Kup",
    "Buy & Use": "Kup i użyj",
    "Buy and use immediately": "Kup i użyj od razu",
    "Buy for ${0}": "Kup za ${0}",
    "Card value = the <0>sum of all numbers</0> in the final answer": "Wartość karty = <0>suma wszystkich liczb</0> w odpowiedzi",
    "Card value = the final answer (a number)": "Wartość karty = końcowy wynik zadania (liczba)",
    "Cards played": "Zagrane karty",
    "Cash Out: ${0}": "Odbierz: ${0}",
    "Cheat Sheet": "Ściąga",
    "Cheat Sheet Pack": "Paczka ściąg",
    "Chips per card are capped at ±{VALUE_CAP}": "Jedna karta daje najwyżej ±{VALUE_CAP} Żetonów",
    "Choose {0}": "Wybierz: {0}",
    "Choose your next Blind": "Wybierz następną ciemną",
    "Clear": "Wyczyść",
    "Close (Esc)": "Zamknij (Esc)",
    "Continue": "Kontynuuj",
    "Correct notes": "Poprawne notatki",
    "Could not save the result": "Nie udało się zapisać wyniku",
    "Could not sign in": "Nie udało się zalogować",
    "Could not sign out": "Nie udało się wylogować",
    "CRT effect": "Efekt CRT",
    "Defeated / Skipped": "Pokonana / pominięta",
    "Defeated by": "Pokonany przez",
    "Deselect": "Odznacz",
    "Deselect card": "Odznacz kartę",
    "Discard": "Odrzuć",
    "Discards": "Zrzutki",
    "e.g. 12, -3/2, 2√3": "np. 12, -3/2, 2√3",
    "e.g. mateusz": "np. mateusz",
    "Email confirmation is enabled in Supabase - disable it for PIN login": "W Supabase jest włączone potwierdzanie maila - wyłącz je dla logowania PIN-em",
    "Endless Mode": "Tryb bez końca",
    "Enter": "Wejdź",
    "Entering...": "Wchodzę...",
    "Eraser": "Gumka",
    "Extended": "Rozszerzenie",
    "Foil: +50 Chips": "Folia: +50 Żetonów",
    "GAME OVER": "KONIEC GRY",
    "Game speed": "Szybkość gry",
    "Guest": "Gość",
    "Hands": "Ręce",
    "Hide English translation": "Ukryj tłumaczenie angielskie",
    "Holographic: +10 Mult": "Holografia: +10 Mnożnika",
    "HOW TO": "JAK GRAĆ",
    "Improve your run!": "Ulepsz swoją grę!",
    "Joker Pack": "Paczka jokerów",
    "JUMBO": "JUMBO",
    "Language": "Język",
    "Leaderboard": "Ranking",
    "Leaderboard needs Supabase (see README).": "Ranking wymaga Supabase (zobacz README).",
    "Let's go!": "Do dzieła!",
    "Level up: [c:+{0}] Chips and [m:+{1}] Mult": "Poziom w górę: [c:+{0}] Żetonów i [m:+{1}] Mnożnika",
    "Loading...": "Ładowanie...",
    "Log in": "Zaloguj",
    "Log in to appear on the leaderboard": "Zaloguj się, by trafić do rankingu",
    "Log out": "Wyloguj",
    "Login": "Login",
    "Login: 3-20 characters, lowercase letters, digits, - or _": "Login: 3-20 znaków, małe litery, cyfry, - lub _",
    "Main menu": "Menu główne",
    "Main Menu": "Menu główne",
    "MEGA": "MEGA",
    "Money earned": "Zarobione pieniądze",
    "Most played hand": "Najczęstszy układ",
    "Music": "Muzyka",
    "Negative: +1 Joker slot": "Negatyw: +1 miejsce na Jokera",
    "New login? We create the account automatically. Same login next time = your results.": "Nowy login? Konto zakłada się samo. Ten sam login następnym razem = Twoje wyniki.",
    "New Run": "Nowa gra",
    "Next Round": "Następna runda",
    "No runs yet. Be the first!": "Brak wyników. Bądź pierwszy!",
    "None yet": "Jeszcze żadnych",
    "Not a number I can read": "Nie rozpoznaję tej liczby",
    "Notes": "Notatki",
    "Off": "Wył.",
    "On": "Wł.",
    "Online accounts are not configured (VITE_SUPABASE_URL). You can play as a guest.": "Konta online nie są skonfigurowane (VITE_SUPABASE_URL). Możesz grać jako gość.",
    "Open": "Otwórz",
    "Open task": "Otwórz zadanie",
    "Options": "Opcje",
    "OPTIONS": "OPCJE",
    "or": "lub",
    "Pan": "Przesuwanie",
    "PIN or short password": "PIN lub krótkie hasło",
    "PIN: at least 4 characters": "PIN: co najmniej 4 znaki",
    "PLAY": "GRAJ",
    "Play as guest": "Graj jako gość",
    "Play Hand": "Zagraj rękę",
    "Player": "Gracz",
    "Polychrome: x1.5 Mult": "Polichromia: x1.5 Mnożnika",
    "random": "losowy",
    "RANKING": "RANKING",
    "Redeem": "Wykup",
    "Redeemed vouchers": "Wykupione bony",
    "Reduced motion": "Mniej ruchu",
    "Remaining deck: {0}": "Pozostało w talii: {0}",
    "Reroll": "Losuj",
    "Rerolls": "Losowania",
    "Result saved to the leaderboard": "Wynik zapisany w rankingu",
    "Revealed value": "Ujawniona wartość",
    "Reward:": "Nagroda:",
    "Round": "Runda",
    "Round score": "Wynik rundy",
    "Rules": "Zasady",
    "Run Info": "Info o grze",
    "Saved to the leaderboard": "Zapisano w rankingu",
    "Saving to leaderboard...": "Zapisuję w rankingu...",
    "Score": "Wynik",
    "Score at least": "Zdobądź co najmniej",
    "Seed": "Ziarno",
    "Seed (optional)": "Ziarno (opcjonalnie)",
    "Select": "Wybierz",
    "Select for play": "Zaznacz do zagrania",
    "Sell": "Sprzedaj",
    "SHOP": "SKLEP",
    "Show English translation": "Pokaż tłumaczenie angielskie",
    "Shuffling the exam sheets...": "Tasuję arkusze maturalne...",
    "Sign in or create an account": "Zaloguj się lub załóż konto",
    "Skip": "Pomiń",
    "Skip Blind": "Pomiń ciemną",
    "Small Blind": "Mała ciemna",
    "Sort Hand": "Sortuj rękę",
    "Sound effects": "Efekty dźwiękowe",
    "Start a new run? The current run will be lost.": "Zacząć nową grę? Obecna gra przepadnie.",
    "Tag": "Znacznik",
    "Take": "Weź",
    "Take this card": "Weź tę kartę",
    "Task Pack": "Paczka zadań",
    "Theorem": "Twierdzenie",
    "Theorem Pack": "Paczka twierdzeń",
    "This card is face down - play it to reveal it": "Ta karta jest zakryta - zagraj ją, by ją odsłonić",
    "to earn": "aby zarobić",
    "Total score": "Łączny wynik",
    "Undo": "Cofnij",
    "Upcoming": "Nadchodzi",
    "Use": "Użyj",
    "Value range": "Przedział wartości",
    "Value sign": "Znak wartości",
    "Voucher": "Bon",
    "VOUCHER": "BON",
    "Vouchers & Boss": "Bony i Boss",
    "Welcome back!": "Witaj ponownie!",
    "Wrong PIN for this login": "Zły PIN dla tego loginu",
    "YOU WIN!": "WYGRANA!",
    "Your answer (note)": "Twoja odpowiedź (notatka)",
    "Your note was right ✓": "Twoja notatka była poprawna ✓",
    "Your note was wrong ✗": "Twoja notatka była błędna ✗",
    "Your note: {note}": "Twoja notatka: {note}",
    "Zoom in": "Powiększ",
    "Zoom out": "Pomniejsz",
    "Σ sum of numbers": "Σ suma liczb",
}


def unescape(s: str) -> str:
    return s.encode("utf-8").decode("unicode_escape").encode("latin-1").decode("utf-8") if "\\" in s else s


def escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def main():
    text = PO.read_text(encoding="utf-8")
    missing = []

    def repl(m: re.Match) -> str:
        msgid = m.group(1)
        key = msgid.replace('\\"', '"')
        if key == "":
            return m.group(0)
        tr = PL.get(key)
        if tr is None:
            missing.append(key)
            return m.group(0)
        return f'msgid "{msgid}"\nmsgstr "{escape(tr)}"'

    text = re.sub(r'msgid "((?:[^"\\]|\\.)*)"\nmsgstr "(?:[^"\\]|\\.)*"', repl, text)
    PO.write_text(text, encoding="utf-8")
    if missing:
        print("MISSING:")
        for k in missing:
            print("  ", k)
    else:
        print("all translated")


if __name__ == "__main__":
    main()
