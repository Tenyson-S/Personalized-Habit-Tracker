import os
import shutil

def apply_patch():
    # Source directory for the patch files
    src_dir = r"z:\Habit Tracker\Phase 3\Personalized Habit Tracker\phase3c-to-phase3d-patch\phase3c-to-phase3d-patch"
    
    # Destination directory (the root of the project)
    dest_dir = r"z:\Habit Tracker\Phase 3\Personalized Habit Tracker"
    
    print(f"Applying Phase 3D patch from: {src_dir}")
    print(f"To: {dest_dir}\n")

    if not os.path.exists(src_dir):
        print(f"Error: Source directory not found: {src_dir}")
        return

    # Files to explicitly ignore (protect the user's environment)
    ignore_files = {'.env'}

    files_copied = 0

    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file in ignore_files:
                print(f"Skipping protected file: {file}")
                continue

            src_path = os.path.join(root, file)
            
            # Calculate the relative path from the source root
            rel_path = os.path.relpath(src_path, src_dir)
            
            # Calculate the destination path
            dest_path = os.path.join(dest_dir, rel_path)
            
            # Ensure the destination directory exists
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            
            # Copy the file (overwrites if it already exists)
            shutil.copy2(src_path, dest_path)
            print(f"Merged: {rel_path}")
            files_copied += 1

    print(f"\nSuccess! Phase 3D Patch applied. {files_copied} files merged.")

if __name__ == "__main__":
    apply_patch()
