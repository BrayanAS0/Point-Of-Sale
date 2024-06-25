import sys
import mysql.connector
import win32print
from escpos.constants import ESC, GS
import textwrap
import unidecode
import time

def connect_to_database():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="pos"
    )

def get_ticket_data(venta_id):
    connection = connect_to_database()
    cursor = connection.cursor(dictionary=True)
    
    query = "SELECT * FROM ventas WHERE id_venta = %s"
    cursor.execute(query, (venta_id,))
    venta = cursor.fetchone()
    
    cursor.close()
    connection.close()
    
    return venta

def send_raw_data(printer_name, data):
    hPrinter = win32print.OpenPrinter(printer_name)
    try:
        hJob = win32print.StartDocPrinter(hPrinter, 1, ("Ticket", None, "RAW"))
        try:
            win32print.StartPagePrinter(hPrinter)
            win32print.WritePrinter(hPrinter, data)
            win32print.EndPagePrinter(hPrinter)
        finally:
            win32print.EndDocPrinter(hPrinter)
    finally:
        win32print.ClosePrinter(hPrinter)

def create_and_print_ticket(venta_id, total_amount, received_amount, change):
    time.sleep(0.5)
    
    venta = get_ticket_data(venta_id)
    if not venta:
        return
    
    printer_name = win32print.GetDefaultPrinter()
    
    data = (
        ESC + b"@"  # Initialize printer
        + ESC + b"t" + b"\x10"  # Select character code table (PC437: USA, Standard Europe)
        + ESC + b"a" + b"\x01"  # Center align
        + unidecode.unidecode("NOMBRE DE LA TIENDA\n").encode('cp437')
        + unidecode.unidecode("Dirección\n").encode('cp437')
        + unidecode.unidecode("Teléfono\n\n").encode('cp437')
        + ESC + b"a" + b"\x00"  # Left align
        + f"Fecha: {venta['fecha']}\n".encode('cp437')
        + f"Hora: {venta['hora']}\n".encode('cp437')
        + f"Folio: {venta['id_venta']}\n".encode('cp437')
        + unidecode.unidecode("Cant Producto               Precio   Importe\n").encode('cp437')
        + b"-" * 48 + b"\n"
    )
    
    ticket_lines = venta['ticket'].split('\n')
    for line in ticket_lines:
        if line:
            parts = line.split(' | ')
            if len(parts) == 6:
                _, name, _, quantity, price, subtotal = parts
                product_lines = textwrap.wrap(unidecode.unidecode(name), 22)
                
                first_line = f"{quantity.rjust(4)} {product_lines[0].ljust(22)} {price.rjust(8)} {subtotal.rjust(8)}\n".encode('cp437')
                data += first_line
                
                for additional_line in product_lines[1:]:
                    data += f"     {additional_line.ljust(22)}\n".encode('cp437')

    data += (
        b"-" * 48 + b"\n"
        + ESC + b"a" + b"\x02"  # Right align
        + f"Total: ${float(total_amount):.2f}\n".encode('cp437')
        + f"Recibido: ${float(received_amount):.2f}\n".encode('cp437')
        + f"Cambio: ${float(change):.2f}\n".encode('cp437')
        + b"\n"
        + ESC + b"a" + b"\x01"  # Center align
        + unidecode.unidecode("Gracias por su compra!\n\n").encode('cp437')
        + ESC + b"d" + b"\x03"  # Feed 3 lines
        + GS + b"V\x00"  # Partial cut
    )
    
    send_raw_data(printer_name, data)

if __name__ == "__main__":
    if len(sys.argv) != 5:
        sys.exit(1)
    
    try:
        venta_id = int(sys.argv[1])
        total_amount = float(sys.argv[2])
        received_amount = float(sys.argv[3])
        change = float(sys.argv[4])
        create_and_print_ticket(venta_id, total_amount, received_amount, change)
    except ValueError:
        sys.exit(1)