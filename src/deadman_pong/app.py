
# src/deadman_pong/app.py
import toga
from toga.style import Pack
from toga.style.pack import COLUMN, CENTER
import subprocess, sys, os

class DeadmanPongApp(toga.App):
    def startup(self):
        main_box = toga.Box(style=Pack(direction=COLUMN, alignment=CENTER, padding=20))

        label = toga.Label(
            "DeadmanXXXII's Classic Pong",
            style=Pack(padding=10, font_size=22, text_align=CENTER)
        )

        start_button = toga.Button(
            "🎮 Launch Game",
            on_press=self.start_game,
            style=Pack(padding=10)
        )

        quit_button = toga.Button(
            "❌ Exit",
            on_press=lambda x: self.exit(),
            style=Pack(padding=10)
        )

        main_box.add(label)
        main_box.add(start_button)
        main_box.add(quit_button)

        self.main_window = toga.MainWindow(title=self.formal_name)
        self.main_window.content = main_box
        self.main_window.show()

    def start_game(self, widget):
        pong_path = os.path.join(os.path.dirname(__file__), "pong.py")
        # Run the pong.py in a subprocess so the GUI stays responsive
        try:
            subprocess.Popen([sys.executable, pong_path])
        except Exception as e:
            # Fallback: try running as a module
            subprocess.Popen([sys.executable, "-u", pong_path])

def main():
    return DeadmanPongApp("DeadmanPong", "com.deadman.pong")
