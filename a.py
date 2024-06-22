import winreg

def list_usb_devices():
    try:
        print("Dispositivos USB conectados:")
        
        # Abrir la clave del registro que contiene información sobre los dispositivos USB
        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SYSTEM\CurrentControlSet\Enum\USB")
        
        # Iterar sobre las subclaves (VID_PID)
        for i in range(winreg.QueryInfoKey(key)[0]):
            try:
                vid_pid = winreg.EnumKey(key, i)
                # Abrir la subclave
                subkey = winreg.OpenKey(key, vid_pid)
                
                # Iterar sobre los dispositivos con este VID_PID
                for j in range(winreg.QueryInfoKey(subkey)[0]):
                    try:
                        device_id = winreg.EnumKey(subkey, j)
                        device_key = winreg.OpenKey(subkey, device_id)
                        
                        # Intentar obtener el nombre descriptivo del dispositivo
                        try:
                            device_desc = winreg.QueryValueEx(device_key, "DeviceDesc")[0]
                        except FileNotFoundError:
                            device_desc = "Desconocido"
                        
                        print(f"Nombre: {device_desc}")
                        print(f"ID del dispositivo: USB\\{vid_pid}\\{device_id}")
                        print("---")
                    
                    except WindowsError:
                        pass
            except WindowsError:
                pass
    
    except Exception as e:
        print(f"Error inesperado: {e}")

if __name__ == "__main__":
    list_usb_devices()