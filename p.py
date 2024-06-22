import win32print
import win32ui
from escpos.constants import ESC, GS, PAPER_FULL_CUT

def send_raw_data(printer_name, data):
    hPrinter = win32print.OpenPrinter(printer_name)
    try:
        hJob = win32print.StartDocPrinter(hPrinter, 1, ("Test page", None, "RAW"))
        try:
            win32print.StartPagePrinter(hPrinter)
            win32print.WritePrinter(hPrinter, data)
            win32print.EndPagePrinter(hPrinter)
        finally:
            win32print.EndDocPrinter(hPrinter)
    finally:
        win32print.ClosePrinter(hPrinter)

def create_and_print_ticket(ticket_content):
    printer_name = win32print.GetDefaultPrinter()
    
    data = (
        ESC + b"@"  # Initialize printer
        + ESC + b"a" + b"\x01"  # Center align
        + b"NOMBRE DE LA TIENDA\n"
        + b"Direccion\n"
        + b"Telefono\n\n"
        + ESC + b"a" + b"\x00"  # Left align
        + b"Producto        Cant  Precio  Total\n"
        + b"-" * 42 + b"\n"
    )
    
    total = 0
    for item in ticket_content:
        product = item['product'][:20].ljust(20)
        quantity = str(item['quantity']).rjust(4)
        price = f"{float(item['price'].replace('$', '')):6.2f}"
        amount = item['quantity'] * float(item['price'].replace('$', ''))
        total += amount
        line = f"{product}{quantity}{price} {amount:6.2f}\n".encode('ascii', 'replace')
        data += line
    
    data += (
        b"-" * 42 + b"\n"
        + f"Total: ${total:6.2f}\n\n".encode('ascii', 'replace')
        + ESC + b"a" + b"\x01"  # Center align
        + b"Gracias por su compra!\n\n"
        + GS + b"V" + PAPER_FULL_CUT
    )
    
    try:
        send_raw_data(printer_name, data)
        print("Ticket impreso correctamente.")
    except Exception as e:
        print(f"Error al imprimir: {e}")

# Ejemplo de uso
sample_ticket_content = [
    {"product": "Camiseta", "quantity": 2, "price": "$15.99"},
    {"product": "Pantalón vaquero azul", "quantity": 1, "price": "$29.99"},
    {"product": "Calcetines deportivos", "quantity": 3, "price": "$5.99"},
    {"product": "Chaqueta de cuero", "quantity": 1, "price": "$89.99"},
]

print("¿Desea imprimir el ticket? (s/n)")
if input().lower() == 's':
    create_and_print_ticket(sample_ticket_content)
else:
    print("Impresión cancelada.")