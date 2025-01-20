from flask import Flask, send_file
from openpyxl.styles import numbers
import os
from flask import Flask, render_template, request, redirect, url_for, flash
import pdfplumber
from openai import OpenAI
import json
from openpyxl import load_workbook

# Make sure the OPENAI_API_KEY is set as an environment variable or replace with your key directly
# openai.api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(
    # This is the default and can be omitted
    api_key=os.environ.get("OPENAI_API_KEY"),
)

app = Flask(__name__)
app.secret_key = "some_random_secret_key_for_sessions"

# --- Replace the prompt below with your full prompt if you wish to keep it in your code as a string ---
# For brevity, I'm showing just a portion. Insert your entire prompt as needed.
CUSTOM_PROMPT = """You are a helpful AI agent that takes in text data extracted from an invoice in pdf format and generates financial reports. You are intelligent and will discard irrelevant information such as the client data (address, phone number, fax number, etc.). You can ignore the entire allowances section.
The only information that matters are listed below:
The essential fields: project name (use project location if project name is not available but project location is), contractor name, billing date, invoice number. If you cannot find any of these essential fields, put None as the value.
Also, we need the items, their names, whether they are material or labor (to be determined by you using the data given), the quantity, unit price, and total price (unit price times quantity).
There are also breakdowns of the previously listed prices so that we can calculate the total price for a given section (you must take this into account). Here's the data (one format of many possible formats):

Here's how the data must be formatted (in JSON):
{
“project_name”: None,
“contractor_name”: “name of the the contractor”,
“billing_date”: “DD/MM/YYYY”,
“invoice_number”: “12345” (put the actual number found in document or None if not found),
“total_invoice_price”: “total amount (dollar + cents) here”,
“items”: [
	{
		“item”: “item name”,
		“item type”: “material” or “labor” (determined by you),
		“quantity”: “quantity of the item”,
		“unit”: “Counting unit”,
		“unit price”: “Price for one unit”,
		“total price”: “Total price for the item (quantity * unit price usually)”
},
{
		“item”: “item name”,
		“item type”: “material” or “labor” (determined by you),
		“quantity”: “quantity of the item”,
		“unit”: “Counting unit”,
		“unit price”: “Price for one unit”,
		“total price”: “Total price for the item (quantity * unit price usually)”
}
]
}


"""


def extract_text(pdf_file):
    """
    Extracts text from the uploaded PDF file using pdfplumber.
    Returns the combined text of all pages.
    """
    all_text = ""
    with pdfplumber.open(pdf_file) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                all_text += page_text + "\n"
    return all_text


def modify_xlsx(json_res):
    file_path = 'doc.xlsx'  # Replace with your file path
    workbook = load_workbook(file_path)

    material = 0
    labor = 0
    for item in json_res['items']:
        total_price = float(item['total price'].replace(
            '$', '').replace(',', '').strip())
        if item['item type'] == 'material':
            material += total_price
        elif item['item type'] == 'labor':
            labor += total_price

    sheet = workbook['Sheet1']

    # Populate general fields
    sheet['B6'] = json_res['project_name']
    sheet['B7'] = json_res['contractor_name']
    sheet['B8'] = json_res['billing_date']
    sheet['B9'] = json_res['invoice_number']

    # Format material and labor fields as currency
    sheet['B11'] = material
    sheet['B11'].number_format = numbers.FORMAT_CURRENCY_USD_SIMPLE

    sheet['B13'] = labor
    sheet['B13'].number_format = numbers.FORMAT_CURRENCY_USD_SIMPLE

    # sheet['N6'] = sheet['N6'].value.replace('XXX', str(json_res['project_name']))
    # sheet['N9'] = sheet['N9'].value.replace('XXX', str(json_res['contractor_name']))
    # sheet['N13'] = sheet['N13'].value.replace('XXX', str(json_res['project_name']))
    # sheet['N14'] = sheet['N14'].value.replace('XXX', str(json_res['contractor_name']))
    # sheet['N17'] = sheet['N17'].value.replace('XXX', str(json_res['project_name']))
    # sheet['N18'] = sheet['N18'].value.replace('XXX', str(json_res['project_name']))

    # Save the changes
    try:
        workbook.save('res.xlsx')
        print("Excel file updated successfully with currency formatting!")
    except PermissionError:
        print(
            f"Permission denied: Unable to save {file_path}. Close the file and try again.")


@app.route("/")
def index():
    """
    Render the home page with an upload form.
    """
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload_file():
    """
    Handle the file upload, extract text, send to OpenAI, and display JSON output.
    """
    # Check if a file was uploaded
    if "pdf" not in request.files or request.files["pdf"].filename == "":
        flash("No PDF file selected. Please choose a file to upload.", "danger")
        return redirect(url_for("index"))

    pdf_file = request.files["pdf"]

    # Extract text from the PDF
    extracted_text = extract_text(pdf_file)

    # Construct the messages for the ChatCompletion request
    messages = [
        {
            "role": "system",
            "content": "You are ChatGPT, a large language model that is helping with invoice data extraction."
        },
        {
            "role": "user",
            "content": f"{CUSTOM_PROMPT}\n\nHere is the extracted PDF text:\n{extracted_text}"
        }
    ]

    try:
        # Call the OpenAI API
        # response = openai.ChatCompletion.create(
        #     model="o1",
        #     messages=messages,
        #     temperature=0.7
        # )

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        # Extract the assistant's response (JSON)
        assistant_response = response.choices[0].message.content
        json_response = json.loads(assistant_response)

        modify_xlsx(json_response)

        return render_template("result.html", result=json_response)

    except Exception as e:
        flash(f"Error calling OpenAI API: {str(e)}", "danger")
        return redirect(url_for("index"))


@app.route('/download/res.xlsx')
def download_excel():
    return send_file('./res.xlsx', as_attachment=True, download_name='res.xlsx')


if __name__ == "__main__":
    app.run(debug=True)
