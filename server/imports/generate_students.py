import csv
from pathlib import Path

names = ["Aung Min Khant", "Thiri Mon", "Kyaw Zin Oo", "Su Myat Noe", "Htet Aung", "Yoon Myat Thu", "Kaung Htet", "Nandar Hlaing", "Min Thant", "May Zin Win"]
output = Path(__file__).with_name("students_2021_2025_cse_ece.csv")

with output.open("w", newline="", encoding="utf-8") as file:
    writer = csv.writer(file)
    writer.writerow(["student_name", "roll_number", "email", "phone", "major", "batch", "year", "status"])
    for batch in range(2021, 2026):
        for major in ("CSE", "ECE"):
            for number in range(1, 61):
                name = f"{names[(number - 1) % 10]} {(number - 1) // 10 + 1}"
                writer.writerow([name, f"{batch}-MIIT-{major}-{number:03d}", f"{name.replace(' ', '').lower()}.{major.lower()}{batch}.{number:03d}@gmail.com", f"09768{(batch - 2021) * 120 + (60 if major == 'ECE' else 0) + number:06d}", major, f"{batch} Batch", "3rd Year", "Active"])
