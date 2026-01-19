import os

def check_paths():
    # Simulate being in backend/routers/system.py
    # But we are running this script likely from web-unspec root or backend root.
    # Let's adjust manually to match the logic of the file we saw.
    
    # Logic from system.py:
    # project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    # This assumes __file__ is in backend/routers/system.py
    
    # Let's construct the 'would-be' path of system.py
    cwd = os.getcwd()
    print(f"Current Working Directory: {cwd}")
    
    # Construct the absolute path to system.py based on known structure
    # web-unspec/backend/routers/system.py
    mock_system_py_path = os.path.join(cwd, "backend", "routers", "system.py")
    print(f"Mock system.py path: {mock_system_py_path}")
    
    # Execute the logic
    # 1. up to routers
    step1 = os.path.dirname(mock_system_py_path)
    # 2. up to backend
    step2 = os.path.dirname(step1)
    # 3. up to web-unspec (root)
    project_root = os.path.dirname(step2)
    
    print(f"Calculated Project Root: {project_root}")
    
    files_to_check = ["WOC_MASTER_DOCUMENT.md", "README.md"]
    
    for filename in files_to_check:
        print(f"\nChecking {filename}...")
        file_path = os.path.join(project_root, filename)
        print(f"Target Path: {file_path}")
        
        if os.path.exists(file_path):
            print("  [OK] File exists.")
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    print(f"  [OK] Read success. Length: {len(content)}")
            except Exception as e:
                print(f"  [FAIL] Read error: {e}")
        else:
            print("  [FAIL] File does not exist at this path.")
            
            # test fallbacks
            fallback_1 = os.path.abspath(os.path.join(cwd, "..", filename))
            print(f"  Fallback 1 (cwd/..): {fallback_1} -> {os.path.exists(fallback_1)}")
            
            fallback_2 = os.path.abspath(filename)
            print(f"  Fallback 2 (cwd): {fallback_2} -> {os.path.exists(fallback_2)}")

if __name__ == "__main__":
    check_paths()
