
from fpdf import FPDF
from faker import Faker
import random
import os

fake = Faker('en_GB')

OUTPUT_DIR = "fixtures/certificates"
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

class CertificateGenerator(FPDF):
    def header(self):
        # NaCTSO Style Mock Header
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'Action Counters Terrorism (ACT) Awareness', 0, 1, 'C')
        self.ln(10)

def generate_certificate(cert_type="A"):
    pdf = CertificateGenerator()
    pdf.add_page()
    
    name = fake.name()
    date = fake.date_between(start_date='-2y', end_date='today')
    cert_id = fake.uuid4()

    if cert_type == "A":
        # Type A: Official Style
        pdf.set_font("Times", size=12)
        pdf.cell(0, 10, txt=f"This is to certify that", ln=1, align="C")
        pdf.set_font("Times", 'B', 24)
        pdf.cell(0, 20, txt=name, ln=1, align="C")
        pdf.set_font("Times", size=12)
        pdf.cell(0, 10, txt=f"Has successfully completed the ACT Awareness e-Learning", ln=1, align="C")
        pdf.cell(0, 10, txt=f"Date: {date}", ln=1, align="C")
        pdf.set_font("Courier", size=8)
        pdf.cell(0, 10, txt=f"Ref: {cert_id}", ln=1, align="R")

    elif cert_type == "B":
        # Type B: LMS Style (Sans Serif, Borders)
        pdf.rect(5, 5, 200, 287)
        pdf.set_font("Arial", 'B', 20)
        pdf.cell(0, 30, txt="CERTIFICATE OF COMPLETION", ln=1, align="C")
        pdf.set_font("Arial", size=14)
        pdf.cell(0, 10, txt=f"Awarded to: {name}", ln=1, align="L")
        pdf.cell(0, 10, txt=f"Course: Counter-Terrorism Awareness", ln=1, align="L")
        pdf.cell(0, 10, txt=f"Completed: {date}", ln=1, align="L")
        
    # Standard save
    filename = f"{OUTPUT_DIR}/cert_{cert_type}_{random.randint(1000,9999)}.pdf"
    pdf.output(filename)
    print(f"Generated {filename} for {name}")
    return filename, name, date

if __name__ == "__main__":
    print("Generating Synthetic Certificates...")
    for _ in range(5):
        generate_certificate("A")
    for _ in range(5):
        generate_certificate("B")
