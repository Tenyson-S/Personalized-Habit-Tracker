import hashlib
import sys
import os

def check_sha(zip_file, sha_file):
    if not os.path.exists(zip_file) or not os.path.exists(sha_file):
        print(f"Skipping {zip_file} - file missing.")
        return

    # Read expected hash
    with open(sha_file, 'r') as f:
        expected_hash = f.read().split()[0].strip().lower()

    # Calculate actual hash
    sha256_hash = hashlib.sha256()
    with open(zip_file, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
            
    actual_hash = sha256_hash.hexdigest().lower()

    if expected_hash == actual_hash:
        print(f"✅ PASS: {zip_file}")
        print(f"   Hash: {actual_hash}")
    else:
        print(f"❌ FAIL: {zip_file}")
        print(f"   Expected: {expected_hash}")
        print(f"   Actual:   {actual_hash}")

if __name__ == "__main__":
    print("Verifying Checksums...\n")
    check_sha("phase3c-to-phase3d-patch.zip", "phase3c-to-phase3d-patch.zip.sha256")
    check_sha("project-village-phase3d.zip", "project-village-phase3d.zip.sha256")
